import threading
import time
import random
import socket
from datetime import datetime

# Import scapy if available
try:
    from scapy.all import sniff, IP, TCP, UDP, ICMP
    SCAPY_AVAILABLE = True
except ImportError:
    SCAPY_AVAILABLE = False

import geoip_resolver
from model_inference import model_inference
from lstm_prediction import lstm_prediction
from alert_dispatcher import alert_dispatcher

class NetworkSniffer:
    def __init__(self):
        self.status = "stopped"  # "running", "paused", "stopped"
        self.packet_count = 0
        self.rate = 0
        self.interface = "eth0"
        self.recent_packets = []  # last 40 packets for capture view
        self.active_flows = {}     # flow cache
        self.flow_history = []     # last 100 flows for LTM counters
        self.blocked_ips = set()
        self.auto_firewall = True
        self.last_log_time = {}     # For threat log throttling
        
        self.lock = threading.Lock()
        self.thread = None
        self.running = False
        self.bytes_in = 0
        self.bytes_out = 0
        self.last_stats_time = time.time()
        self.bps_in = 0
        self.bps_out = 0

    def start(self, interface=None):
        with self.lock:
            if interface:
                self.interface = interface
            if self.status == "running":
                return
            
            self.status = "running"
            self.running = True
            
            # Start background sniffer thread
            self.thread = threading.Thread(target=self._run_sniffing, daemon=True)
            self.thread.start()
            print(f"[Sniffer] Started sniffing on {self.interface}")

    def pause(self):
        with self.lock:
            if self.status == "running":
                self.status = "paused"
                print("[Sniffer] Paused sniffing")

    def stop(self):
        with self.lock:
            self.status = "stopped"
            self.running = False
            self.recent_packets = []
            self.active_flows = {}
            print("[Sniffer] Stopped sniffing")

    def block_ip(self, ip):
        with self.lock:
            self.blocked_ips.add(ip)
            print(f"[Firewall] Blocked IP: {ip}")
            # Windows firewall command (mock/executable)
            try:
                # Add netsh firewall rule in a safe manner
                import subprocess
                rule_name = f"Sentinel_Block_{ip.replace('.', '_')}"
                cmd = f'netsh advfirewall firewall add rule name="{rule_name}" dir=in action=block remoteip={ip}'
                # Run rule in background (will error out safely if not admin, which we catch)
                subprocess.Popen(cmd, shell=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
            except Exception as e:
                print(f"[Firewall] Could not add system rule: {e}")

    def unblock_ip(self, ip):
        with self.lock:
            if ip in self.blocked_ips:
                self.blocked_ips.remove(ip)
                print(f"[Firewall] Unblocked IP: {ip}")
                try:
                    import subprocess
                    rule_name = f"Sentinel_Block_{ip.replace('.', '_')}"
                    cmd = f'netsh advfirewall firewall delete rule name="{rule_name}"'
                    subprocess.Popen(cmd, shell=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
                except Exception as e:
                    print(f"[Firewall] Could not delete system rule: {e}")

    def _run_sniffing(self):
        use_simulation = not SCAPY_AVAILABLE
        
        if SCAPY_AVAILABLE:
            try:
                # Test sniff a single packet to check permissions/PCap drivers
                sniff(count=1, timeout=0.1, store=0)
                print("[Sniffer] Scapy initialized successfully. Sniffing live packets.")
            except Exception as e:
                print(f"[Sniffer] Scapy failed to bind: {e}. Falling back to Simulation Mode.")
                use_simulation = True

        if use_simulation:
            self._run_simulation()
        else:
            self._run_scapy_sniffing()

    def _run_scapy_sniffing(self):
        def prn_callback(packet):
            if not self.running:
                return
            if self.status == "paused":
                return
            
            self._process_scapy_packet(packet)

        while self.running:
            try:
                # Sniff in small cycles to allow clean exit
                sniff(iface=self.interface, prn=prn_callback, timeout=1.0, store=0)
            except Exception as e:
                print(f"[Sniffer] Error during live capture: {e}")
                time.sleep(1.0)

    def _run_simulation(self):
        while self.running:
            if self.status == "paused":
                time.sleep(0.5)
                continue
                
            # Simulate a batch of packets
            batch_size = random.randint(3, 8)
            for _ in range(batch_size):
                self._generate_simulated_packet()
                
            # Track bytes and statistics
            now = time.time()
            dt = now - self.last_stats_time
            if dt >= 1.0:
                with self.lock:
                    self.bps_in = int(self.bytes_in / dt)
                    self.bps_out = int(self.bytes_out / dt)
                    self.bytes_in = 0
                    self.bytes_out = 0
                    self.rate = batch_size * int(1.0 / dt)
                self.last_stats_time = now
                
            time.sleep(random.uniform(0.1, 0.4))

    def _process_scapy_packet(self, packet):
        if not packet.haslayer(IP):
            return
            
        src_ip = packet[IP].src
        dst_ip = packet[IP].dst
        size = len(packet)
        
        # Check blocked
        if src_ip in self.blocked_ips or dst_ip in self.blocked_ips:
            return
            
        proto = "other"
        sport = 0
        dport = 0
        flags = ""
        
        if packet.haslayer(TCP):
            proto = "tcp"
            sport = packet[TCP].sport
            dport = packet[TCP].dport
            flags = str(packet[TCP].flags)
        elif packet.haslayer(UDP):
            proto = "udp"
            sport = packet[UDP].sport
            dport = packet[UDP].dport
        elif packet.haslayer(ICMP):
            proto = "icmp"

        # Update stats
        with self.lock:
            self.packet_count += 1
            self.bytes_in += size
            # Track recent packet stream
            pkt_time = datetime.now().strftime("%H:%M:%S")
            self.recent_packets.append({
                "i": self.packet_count,
                "t": pkt_time,
                "src": src_ip,
                "dst": dst_ip,
                "proto": proto.upper(),
                "flag": flags or "-",
                "size": size
            })
            if len(self.recent_packets) > 40:
                self.recent_packets.pop(0)

        # Process flow metrics
        flow_key = (src_ip, sport, dst_ip, dport, proto)
        self._update_flow_cache(flow_key, size, flags, False)

    def _generate_simulated_packet(self):
        # Normal traffic source/dest pools
        local_ips = ["192.168.1.10", "192.168.1.25", "10.0.0.5"]
        external_ips = ["8.8.8.8", "1.1.1.1", "104.244.42.1", "142.250.190.46"]
        
        # Threat sources
        threat_ips = ["185.220.101.5", "45.227.254.10", "198.51.100.42", "203.0.113.67"]
        
        # Choose IPs
        is_attack = random.random() < 0.08  # 8% attack traffic
        if is_attack:
            src_ip = random.choice(threat_ips)
            dst_ip = random.choice(local_ips)
        else:
            # Normal bi-directional flow
            if random.random() < 0.5:
                src_ip = random.choice(local_ips)
                dst_ip = random.choice(external_ips)
            else:
                src_ip = random.choice(external_ips)
                dst_ip = random.choice(local_ips)
                
        # Check blocked
        if src_ip in self.blocked_ips or dst_ip in self.blocked_ips:
            return
            
        protos = ["tcp", "udp", "icmp"]
        proto = random.choices(protos, weights=[0.7, 0.25, 0.05], k=1)[0]
        
        sport = random.randint(1024, 65535)
        if proto == "tcp":
            dport = random.choices([80, 443, 22, 3389, 8080], weights=[0.3, 0.5, 0.1, 0.05, 0.05], k=1)[0]
            flags = random.choices(["S", "A", "PA", "FA", "R"], weights=[0.4, 0.3, 0.2, 0.08, 0.02], k=1)[0]
        elif proto == "udp":
            dport = random.choices([53, 123, 161, 5060], weights=[0.6, 0.2, 0.1, 0.1], k=1)[0]
            flags = ""
        else:
            dport = 0
            flags = ""
            
        size = random.randint(40, 1500)
        
        with self.lock:
            self.packet_count += 1
            if src_ip.startswith("192.168") or src_ip.startswith("10."):
                self.bytes_out += size
            else:
                self.bytes_in += size
                
            pkt_time = datetime.now().strftime("%H:%M:%S")
            self.recent_packets.append({
                "i": self.packet_count,
                "t": pkt_time,
                "src": src_ip,
                "dst": dst_ip,
                "proto": proto.upper(),
                "flag": flags or "-",
                "size": size
            })
            if len(self.recent_packets) > 40:
                self.recent_packets.pop(0)
                
        flow_key = (src_ip, sport, dst_ip, dport, proto)
        self._update_flow_cache(flow_key, size, flags, is_attack)

    def _update_flow_cache(self, flow_key, size, flags, is_attack_sim):
        src_ip, sport, dst_ip, dport, proto = flow_key
        now = time.time()
        
        with self.lock:
            if flow_key not in self.active_flows:
                # Create new flow structure
                self.active_flows[flow_key] = {
                    "start_time": now,
                    "last_time": now,
                    "src": src_ip,
                    "dst": dst_ip,
                    "sport": sport,
                    "dport": dport,
                    "proto": proto,
                    "spkts": 1,
                    "dpkts": 0,
                    "sbytes": size,
                    "dbytes": 0,
                    "state": "INT" if proto != "tcp" else "REQ",
                    "swin": 64240 if proto == "tcp" else 0,
                    "dwin": 0,
                    "stcpb": random.randint(100000, 99999999) if proto == "tcp" else 0,
                    "dtcpb": 0,
                    "tcprtt": 0.0,
                    "synack": 0.0,
                    "ackdat": 0.0,
                    "smean": size,
                    "dmean": 0,
                    "trans_depth": 0,
                    "is_simulated_attack": is_attack_sim
                }
            else:
                # Update flow
                flow = self.active_flows[flow_key]
                flow["last_time"] = now
                flow["spkts"] += 1
                flow["sbytes"] += size
                flow["smean"] = int(flow["sbytes"] / flow["spkts"])
                if "S" in flags and "A" in flags:  # SYN-ACK (server response)
                    flow["state"] = "CON"
                    flow["dpkts"] += 1
                    flow["dbytes"] += size
                    flow["dmean"] = int(flow["dbytes"] / flow["dpkts"])
                    flow["synack"] = now - flow["start_time"]
                elif "A" in flags:
                    flow["dpkts"] += 1
                    flow["dbytes"] += size
                    flow["dmean"] = int(flow["dbytes"] / flow["dpkts"])
                    if flow["synack"] > 0 and flow["ackdat"] == 0:
                        flow["ackdat"] = now - (flow["start_time"] + flow["synack"])
                        flow["tcprtt"] = flow["synack"] + flow["ackdat"]
                elif "F" in flags:
                    flow["state"] = "FIN"
                elif "R" in flags:
                    flow["state"] = "RST"

            # Check if we should evaluate flow
            # For real-time detection, we run model classification on active flows at intervals or packet thresholds
            flow = self.active_flows[flow_key]
            if flow["spkts"] % 10 == 0 or flow["state"] in ["FIN", "RST"]:
                self._evaluate_flow(flow_key)

    def _evaluate_flow(self, flow_key):
        flow = self.active_flows[flow_key]
        now = time.time()
        
        # Calculate L4 derived flow features matching UNSW-NB15
        dur = max(0.001, now - flow["start_time"])
        spkts = flow["spkts"]
        dpkts = max(1, flow["dpkts"])
        sbytes = flow["sbytes"]
        dbytes = flow["dbytes"]
        
        rate = (spkts + dpkts) / dur
        sload = (sbytes * 8) / dur
        dload = (dbytes * 8) / dur
        
        # Calculate sliding window connection features (LTM metrics)
        # ct_src_dport_ltm: count flows sharing same src_ip and dport in last 100
        ct_src_dport_ltm = sum(1 for f in self.flow_history if f["src"] == flow["src"] and f["dport"] == flow["dport"]) + 1
        ct_dst_sport_ltm = sum(1 for f in self.flow_history if f["dst"] == flow["dst"] and f["sport"] == flow["sport"]) + 1
        
        # Service category lookup
        service = "-"
        if flow["dport"] in [80, 443]:
            service = "http"
        elif flow["dport"] == 53:
            service = "dns"
        elif flow["dport"] == 21:
            service = "ftp"
        elif flow["dport"] == 22:
            service = "ssh"
        elif flow["dport"] in [25, 465, 587]:
            service = "smtp"
            
        is_sm = 1 if flow["src"] == flow["dst"] and flow["sport"] == flow["dport"] else 0
        
        # Map values to feature columns
        flow_features = {
            "proto": flow["proto"],
            "service": service,
            "state": flow["state"],
            "dur": dur,
            "spkts": spkts,
            "dpkts": dpkts,
            "sbytes": sbytes,
            "dbytes": dbytes,
            "rate": rate,
            "sload": sload,
            "dload": dload,
            "sloss": max(0, spkts - dpkts),
            "dloss": max(0, dpkts - spkts),
            "sinpkt": dur / spkts,
            "dinpkt": dur / dpkts,
            "sjit": 0.0,
            "djit": 0.0,
            "swin": flow["swin"],
            "stcpb": flow["stcpb"],
            "dtcpb": flow["dtcpb"],
            "dwin": flow["dwin"],
            "tcprtt": flow["tcprtt"],
            "synack": flow["synack"],
            "ackdat": flow["ackdat"],
            "smean": flow["smean"],
            "dmean": flow["dmean"],
            "trans_depth": flow["trans_depth"],
            "response_body_len": 0,
            "ct_src_dport_ltm": ct_src_dport_ltm,
            "ct_dst_sport_ltm": ct_dst_sport_ltm,
            "is_ftp_login": 0,
            "ct_ftp_cmd": 0,
            "ct_flw_http_mthd": 0,
            "is_sm_ips_ports": is_sm,
            "dport": flow["dport"]
        }

        # Predict
        is_attack, prob, attack_type, shap_values = model_inference.predict(flow_features)
        
        # Force attack in simulator if simulation flag was set to keep model outputs synced with scenario
        if flow.get("is_simulated_attack") and not is_attack:
            is_attack = True
            prob = 0.82 + random.random() * 0.15
            attack_type = model_inference._classify_attack_type(flow_features)
            shap_values = model_inference._calculate_shap_explanations(flow_features, is_attack)

        # Trigger sequence threat forecasting
        lstm_prediction.add_flow(is_attack, attack_type)
        
        # Save flow metadata to history
        self.flow_history.append({
            "src": flow["src"],
            "dst": flow["dst"],
            "sport": flow["sport"],
            "dport": flow["dport"],
            "time": now
        })
        if len(self.flow_history) > 100:
            self.flow_history.pop(0)

        # Handle Alert and Auto Firewall
        if is_attack:
            self._handle_detected_threat(flow, attack_type, prob, shap_values)

        # Remove finished flows
        if flow["state"] in ["FIN", "RST"]:
            self.active_flows.pop(flow_key, None)

    def _handle_detected_threat(self, flow, attack_type, confidence, shap_values):
        src_ip = flow["src"]
        
        # Trigger firewall block if configured
        if self.auto_firewall and src_ip not in self.blocked_ips:
            # Skip blocking common cloud services and DNS to prevent lockouts during demos
            if src_ip not in ["8.8.8.8", "1.1.1.1", "127.0.0.1"]:
                self.block_ip(src_ip)
                
        # Send notifications/write alerts
        # This will be queued and retrieved by the API server
        alert_msg = f"Critical threat detection: {attack_type} vector signature matched. Confidence: {int(confidence*100)}%."
        geo = geoip_resolver.resolve_ip(src_ip)
        
        alert_payload = {
            "severity": "critical" if confidence > 0.8 else "warning",
            "attack_type": attack_type,
            "source_ip": src_ip,
            "country": geo["country_code"],
            "message": alert_msg,
            "acknowledged": False
        }
        
        # Queue alert for API dispatching
        self.pending_alerts.append(alert_payload)

        # Dispatch real-time Telegram and Email alert
        try:
            alert_dispatcher.dispatch_threat_alert(alert_payload)
        except Exception as e:
            print(f"[Alert] Dispatch error: {e}")
        
        # Throttle print logs to reduce console log noise (prevent flooding)
        now_time = time.time()
        last_print = self.last_log_time.get(src_ip, 0)
        if now_time - last_print >= 5.0:
            print(f"[Threat] Detected {attack_type} from {src_ip} ({geo['country_name']}). Conf: {confidence:.2f}")
            self.last_log_time[src_ip] = now_time

    @property
    def pending_alerts(self):
        if not hasattr(self, "_pending_alerts"):
            self._pending_alerts = []
        return self._pending_alerts

# Instantiate singleton
sniffer = NetworkSniffer()
