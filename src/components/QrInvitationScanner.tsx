import React, { useState, useEffect, useRef } from "react";
import { Html5Qrcode } from "html5-qrcode";
import {
  X,
  Camera,
  Upload,
  QrCode,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  Download,
  RefreshCw,
  Info
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export interface ScannedInvitation {
  name?: string;
  phone?: string;
  companions?: number;
  relation_type?: string;
  amount?: number;
  note?: string;
}

interface QrInvitationScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess: (data: ScannedInvitation) => void;
}

interface DemoProfile {
  id: string;
  name: string;
  phone: string;
  companions: number;
  relation_type: string;
  amount: number;
  note: string;
}

const DEMO_PROFILES: DemoProfile[] = [
  {
    id: "demo-1",
    name: "ហេង រតនា",
    phone: "012777888",
    companions: 1,
    relation_type: "ខាងកូនកំលោះ",
    amount: 50,
    note: "សូមជូនពរឱ្យអ្នកទាំងពីរស្រឡាញ់គ្នាដល់ចាស់កោងខ្នង ទទួលបានសុភមង្គលឥតឧបមា!"
  },
  {
    id: "demo-2",
    name: "ម៉ៅ សុខា",
    phone: "099555444",
    companions: 0,
    relation_type: "ខាងកូនក្រមុំ",
    amount: 30,
    note: "រីករាយថ្ងៃអាពាហ៍ពិពាហ៍! ជូនពរទទួលបានកូនប្រុសស្រីឆាប់ៗ និងជោគជ័យគ្រប់ការងារ។"
  },
  {
    id: "demo-3",
    name: "លីម ហេង",
    phone: "085222333",
    companions: 2,
    relation_type: "មិត្តភក្តិ",
    amount: 100,
    note: "Congratulations to the beautiful couple! Happy Wedding Day!"
  }
];

export default function QrInvitationScanner({ isOpen, onClose, onScanSuccess }: QrInvitationScannerProps) {
  const [activeTab, setActiveTab] = useState<"camera" | "upload" | "demo">("camera");
  const [error, setError] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<ScannedInvitation | null>(null);
  const [selectedDemoProfile, setSelectedDemoProfile] = useState<DemoProfile>(DEMO_PROFILES[0]);
  const [simulatingScan, setSimulatingScan] = useState<boolean>(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);

  // Parse QR content format
  const parseQrContent = (text: string): ScannedInvitation => {
    let result: ScannedInvitation = {};
    
    // Attempt 1: Parse as JSON
    try {
      const parsed = JSON.parse(text);
      if (parsed && typeof parsed === "object") {
        result.name = parsed.name || parsed.ឈ្មោះ || parsed.guest_name;
        result.phone = parsed.phone || parsed.លេខទូរស័ព្ទ || parsed.tel;
        result.companions = parsed.companions !== undefined 
          ? Number(parsed.companions) 
          : parsed.ចំនួនមកជាមួយ !== undefined 
          ? Number(parsed.ចំនួនមកជាមួយ) 
          : undefined;
        result.relation_type = parsed.relation_type || parsed.relation || parsed.ទំនាក់ទំនង;
        result.amount = parsed.amount !== undefined 
          ? Number(parsed.amount) 
          : parsed.gift_amount !== undefined 
          ? Number(parsed.gift_amount) 
          : parsed.ទឹកប្រាក់ !== undefined 
          ? Number(parsed.ទឹកប្រាក់) 
          : undefined;
        result.note = parsed.note || parsed.ពរជ័យ || parsed.កំណត់សម្គាល់ || parsed.wishes;
        return result;
      }
    } catch (e) {
      // Ignored, proceed to next parser
    }

    // Attempt 2: Parse as url query params
    try {
      const isUrl = text.startsWith("http://") || text.startsWith("https://") || text.includes("?");
      const queryString = isUrl ? text.substring(text.indexOf("?")) : text;
      const urlParams = new URLSearchParams(queryString);
      
      if (urlParams.has("name") || urlParams.has("phone") || urlParams.has("guest")) {
        result.name = urlParams.get("name") || urlParams.get("guest") || urlParams.get("ឈ្មោះ");
        result.phone = urlParams.get("phone") || urlParams.get("លេខទូរស័ព្ទ");
        result.companions = urlParams.has("companions") ? Number(urlParams.get("companions")) : undefined;
        
        const rawRel = urlParams.get("relation_type") || urlParams.get("relation");
        if (rawRel) result.relation_type = decodeURIComponent(rawRel);
        
        const rawAmount = urlParams.get("amount") || urlParams.get("gift") || urlParams.get("ទឹកប្រាក់");
        if (rawAmount) result.amount = Number(rawAmount);
        
        const rawNote = urlParams.get("note") || urlParams.get("wishes") || urlParams.get("ពរជ័យ");
        if (rawNote) result.note = decodeURIComponent(rawNote);
        
        if (result.name || result.phone) {
          return result;
        }
      }
    } catch (e) {
      // Ignored, proceed to next parser
    }

    // Attempt 3: CSV/Comma-separated or semicolon-separated format
    const parts = text.split(/[,\n;|]/).map(p => p.trim());
    if (parts.length >= 2) {
      result.name = parts[0];
      
      // Look for a part that looks like a phone number
      const foundPhone = parts.find(p => /^[0-9+\s-]{8,15}$/.test(p));
      if (foundPhone) {
        result.phone = foundPhone;
      } else {
        result.phone = parts[1];
      }

      // Check remaining parameters for numbers
      const numericParts = parts.filter(p => !isNaN(Number(p)) && p !== "");
      if (numericParts.length > 0) {
        // If there's a big number, suspect gift amount. If small, companions
        const numbers = numericParts.map(Number);
        const bigNum = numbers.find(n => n >= 5);
        const smallNum = numbers.find(n => n >= 0 && n < 5);
        if (bigNum !== undefined) result.amount = bigNum;
        if (smallNum !== undefined) result.companions = smallNum;
      }

      // Check if relations match Khmer relation types
      const possibleRelations = ["ខាងកូនកំលោះ", "ខាងកូនក្រមុំ", "មិត្តភក្តិ", "ផ្សេងៗ"];
      const foundRel = parts.find(p => possibleRelations.includes(p));
      if (foundRel) result.relation_type = foundRel;

      return result;
    }

    // Attempt 4: Fallback to name
    if (text.trim().length > 0) {
      result.name = text.trim();
    }

    return result;
  };

  const handleDecodedText = (decodedText: string) => {
    try {
      const parsed = parseQrContent(decodedText);
      setSuccessData(parsed);
      setError(null);
    } catch (err) {
      setError("មិនទាន់អាចបកប្រែទិន្នន័យកូដបានឡើយ សូមចូលរួមសាកល្បងម្ដងទៀត។");
    }
  };

  // Camera Reader mounting and unmounting
  useEffect(() => {
    if (!isOpen || activeTab !== "camera") {
      cleanupScanner();
      return;
    }

    setError(null);
    setSuccessData(null);

    const html5QrCode = new Html5Qrcode("qr-camera-element");
    scannerRef.current = html5QrCode;
    let isMounted = true;

    const startCameraScanner = async () => {
      try {
        await html5QrCode.start(
          { facingMode: "environment" },
          {
            fps: 15,
            qrbox: (w, h) => {
              const edge = Math.min(w, h);
              const size = Math.floor(edge * 0.75);
              return { width: size, height: size };
            }
          },
          (decodedText) => {
            if (isMounted) {
              handleDecodedText(decodedText);
            }
          },
          () => {
            // Raw scanner frames silent error logs
          }
        );
      } catch (err: any) {
        console.error(err);
        if (isMounted) {
          setError("មិនអាចដំណើរការកាមេរ៉ាបានទេ! សូមពិនិត្យមើលសិទ្ធិអនុញ្ញាតកាមេរ៉ាក្នុង browser របស់អ្នក ឬប្រើប្រាស់ផ្ទាំងស្កេនរូបភាពជំនួសវិញ។");
        }
      }
    };

    const timer = setTimeout(() => {
      startCameraScanner();
    }, 400);

    return () => {
      isMounted = false;
      clearTimeout(timer);
      cleanupScanner();
    };
  }, [isOpen, activeTab]);

  const cleanupScanner = () => {
    if (scannerRef.current) {
      const scanner = scannerRef.current;
      scannerRef.current = null;
      if (scanner.isScanning) {
        scanner.stop()
          .then(() => {
            try {
              scanner.clear();
            } catch (e) {
              // Ignore boundary errors
            }
          })
          .catch(err => {
            console.warn("Could not stop scanning camera gracefully: ", err);
          });
      }
    }
  };

  // Handle local file selection
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setSuccessData(null);

    try {
      // Create off-screen scanner
      const fileScanner = new Html5Qrcode("qr-file-dummy-container");
      const decodedText = await fileScanner.scanFile(file, true);
      handleDecodedText(decodedText);
      try {
        fileScanner.clear();
      } catch (e) {}
    } catch (err: any) {
      console.error(err);
      setError("រកមិនឃើញ QR Code ក្នុងរូបភាពនេះទេ! សូមប្រាកដថារូបភាពមានពន្លឺល្អ និងមិនងងឹតខ្លាំង។");
    }
  };

  // Simulating demo scan
  const handleSimulateScan = () => {
    setSimulatingScan(true);
    setSuccessData(null);
    setError(null);

    // Simulate 1.2s of visual scanner loop
    setTimeout(() => {
      const jsonPayload = JSON.stringify({
        name: selectedDemoProfile.name,
        phone: selectedDemoProfile.phone,
        companions: selectedDemoProfile.companions,
        relation_type: selectedDemoProfile.relation_type,
        amount: selectedDemoProfile.amount,
        note: selectedDemoProfile.note
      });
      handleDecodedText(jsonPayload);
      setSimulatingScan(false);
    }, 1200);
  };

  // Confirm auto-fill data back to the main App
  const handleConfirmAutoFill = () => {
    if (successData) {
      onScanSuccess(successData);
      onClose();
    }
  };

  // Generate QR Server URL for dynamic testing
  const getDemoQrUrl = (profile: DemoProfile) => {
    const data = JSON.stringify({
      name: profile.name,
      phone: profile.phone,
      companions: profile.companions,
      relation_type: profile.relation_type,
      amount: profile.amount,
      note: profile.note
    });
    return `https://api.qrserver.com/v1/create-qr-code/?size=250x250&color=d946ef&data=${encodeURIComponent(data)}`;
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
        />

        {/* Modal Window Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-md bg-white border border-pink-50 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] z-10"
        >
          {/* Header */}
          <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-pink-50/50 to-rose-50/20">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-pink-100 text-pink-600">
                <QrCode className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <h3 className="text-sm font-bold text-slate-800 font-serif">ស្កេនកាតព័ត៌មានកិត្តិយស</h3>
                <span className="text-[10px] text-slate-450 font-medium">ស្កេន QR Code ដើម្បីទទួលបានការបំពេញស្វ័យប្រវត្ត</span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Tab Menu */}
          <div className="flex border-b border-slate-100 px-4 py-2 gap-1 bg-slate-50/80">
            <button
              onClick={() => { setActiveTab("camera"); setSuccessData(null); setError(null); }}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === "camera"
                  ? "bg-white text-pink-600 shadow-xs border border-pink-50"
                  : "text-slate-500 hover:text-slate-800 hover:bg-white/40"
              }`}
            >
              <Camera className="w-3.5 h-3.5" />
              <span>កាមេរ៉ាស្កេន</span>
            </button>
            <button
              onClick={() => { setActiveTab("upload"); setSuccessData(null); setError(null); }}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === "upload"
                  ? "bg-white text-pink-600 shadow-xs border border-pink-50"
                  : "text-slate-500 hover:text-slate-800 hover:bg-white/40"
              }`}
            >
              <Upload className="w-3.5 h-3.5" />
              <span>ស្កេនរូបភាព QR</span>
            </button>
            <button
              onClick={() => { setActiveTab("demo"); setSuccessData(null); setError(null); }}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === "demo"
                  ? "bg-white text-pink-600 shadow-xs border border-pink-50"
                  : "text-slate-500 hover:text-slate-800 hover:bg-white/40"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>ពិសោធន៍/Demo</span>
            </button>
          </div>

          {/* Dummy element for image files scanning */}
          <div id="qr-file-dummy-container" className="hidden" />

          {/* Scrollable Scanner Panels */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {/* Success state - Preview & Apply data */}
            {successData ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-4"
              >
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-bold text-emerald-800">ស្កេនបានជោគជ័យ!</h4>
                    <p className="text-[11px] text-emerald-650 mt-0.5">ព័ត៌មានអញ្ជើញត្រូវបានអាន។ សូមត្រួតពិនិត្យរូបភាពខាងក្រោម៖</p>
                  </div>
                </div>

                {/* Scanned Card Details */}
                <div className="border border-slate-150 rounded-2xl p-4 bg-slate-50 space-y-3 font-serif">
                  <div className="border-b border-slate-200pb-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">សន្លឹកកាតអញ្ជើញ</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-xs leading-relaxed">
                    <div>
                      <span className="text-slate-450 block font-sans">ឈ្មោះភ្ញៀវ៖</span>
                      <strong className="text-slate-800 text-sm">{successData.name || "មិនស្គាល់ឈ្មោះ"}</strong>
                    </div>
                    <div>
                      <span className="text-slate-450 block font-sans">លេខទូរស័ព្ទ៖</span>
                      <strong className="text-slate-850 font-mono">{successData.phone || "គ្មានទិន្នន័យ"}</strong>
                    </div>
                    <div>
                      <span className="text-slate-450 block font-sans">អ្នករួមដំណើរ៖</span>
                      <strong className="text-slate-800 font-sans">{successData.companions !== undefined ? `${successData.companions} នាក់` : "០ នាក់"}</strong>
                    </div>
                    <div>
                      <span className="text-slate-450 block font-sans">ទំនាក់ទំនង៖</span>
                      <strong className="text-slate-800">{successData.relation_type || "មិត្តភក្តិ"}</strong>
                    </div>
                    {successData.amount !== undefined && (
                      <div className="col-span-2">
                        <span className="text-slate-450 block font-sans">ទឹកប្រាក់ចងដៃ៖</span>
                        <strong className="text-emerald-600 font-sans text-sm">${successData.amount}</strong>
                      </div>
                    )}
                    {successData.note && (
                      <div className="col-span-2 border-t border-slate-200/60 pt-2">
                        <span className="text-slate-450 block text-[10px] italic font-sans">ពាក្យជូនពរ៖</span>
                        <p className="text-slate-650 text-[11px] italic leading-relaxed mt-0.5">"{successData.note}"</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => { setSuccessData(null); setError(null); }}
                    className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-800 font-bold py-2.5 px-4 rounded-xl text-xs transition-colors cursor-pointer text-center"
                  >
                    ស្កេនម្ដងទៀត
                  </button>
                  <button
                    onClick={handleConfirmAutoFill}
                    className="flex-1 bg-pink-600 hover:bg-pink-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs transition-all shadow-xs cursor-pointer text-center"
                  >
                    បំពេញព័ត៌មាននេះស្វ័យប្រវត្ត
                  </button>
                </div>
              </motion.div>
            ) : (
              /* Scanning/Active State corresponding to tabs */
              <div className="space-y-4">
                
                {/* 1. Camera Scanning Panel */}
                {activeTab === "camera" && (
                  <div className="space-y-3">
                    <div className="relative aspect-square w-full max-w-[280px] mx-auto overflow-hidden rounded-2xl bg-slate-900 border-2 border-slate-800 flex flex-col items-center justify-center">
                      
                      {/* Laser scanner effect animation */}
                      <div className="absolute top-0 inset-x-0 h-0.5 bg-gradient-to-r from-pink-500 to-rose-500 shadow-[0_0_15px_#ec4899] z-20 animate-bounce" />

                      {/* Camera view container */}
                      <div id="qr-camera-element" className="w-full h-full object-cover" />

                      {/* Overlays corner indicators */}
                      <div className="absolute top-6 left-6 w-5 h-5 border-t-2 border-l-2 border-pink-500 rounded-tl-sm z-15" />
                      <div className="absolute top-6 right-6 w-5 h-5 border-t-2 border-r-2 border-pink-500 rounded-tr-sm z-15" />
                      <div className="absolute bottom-6 left-6 w-5 h-5 border-b-2 border-l-2 border-pink-500 rounded-bl-sm z-15" />
                      <div className="absolute bottom-6 right-6 w-5 h-5 border-b-2 border-r-2 border-pink-500 rounded-br-sm z-15" />

                      {/* Loading or Scanning indication */}
                      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-slate-950/80 backdrop-blur-xs px-3 py-1 rounded-full text-[9px] text-pink-300 font-bold flex items-center gap-1 shadow-xs z-15">
                        <span className="w-1.5 h-1.5 bg-pink-500 rounded-full animate-ping" />
                        <span>សូមចង្អុល QR ចូលចន្លោះ</span>
                      </div>
                    </div>
                    
                    <p className="text-center text-[10px] text-slate-400 leading-relaxed max-w-xs mx-auto">
                      សូមបើកកាតអញ្ជើញដែលមាន QR Code ដាក់ចំពោះមុខកាមេរ៉ាទូរស័ព្ទ ឬកុំព្យូទ័ររបស់អ្នក ដើម្បីនាំយកឈ្មោះនឹងលេខទូរស័ព្ទ។
                    </p>
                  </div>
                )}

                {/* 2. File Uploading Panel */}
                {activeTab === "upload" && (
                  <div className="space-y-3">
                    <div 
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-slate-200 hover:border-pink-300 rounded-2xl p-6 text-center cursor-pointer hover:bg-pink-50/5 transition-all text-slate-500 group flex flex-col items-center justify-center space-y-3"
                    >
                      <div className="w-12 h-12 rounded-xl bg-pink-50 text-pink-500 flex items-center justify-center group-hover:scale-105 transition-transform duration-200">
                        <Upload className="w-6 h-6" />
                      </div>
                      <div className="space-y-1">
                        <span className="text-xs font-bold text-slate-700 block">ជ្រើសរើសរូបភាពកូដអញ្ជើញ</span>
                        <span className="text-[10px] text-slate-400 font-medium block">JPG, PNG, WEBP ឬ ថតរូបអេក្រង់ (Screenshot) </span>
                      </div>
                      <button
                        type="button"
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-bold transition-all"
                      >
                        ស្វែងរកឯកសារ
                      </button>
                      <input
                        type="file"
                        ref={fileInputRef}
                        accept="image/*"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl flex items-start gap-2 border border-slate-150 text-[10px] text-slate-500 leading-relaxed">
                      <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                      <span>គន្លឹះ៖ លោកអ្នកអាចចម្លង ឬទាញយក រូបភាពគំរូ QR Code នៅក្នុងផ្ទាំងពិសោធន៍ (Demo) រួចយកមកស្កេនបង្ហោះទីនេះបាន ដើម្បីសាកល្បង។</span>
                    </div>
                  </div>
                )}

                {/* 3. Demo / Dynamic Code Testing Simulator */}
                {activeTab === "demo" && (
                  <div className="space-y-4">
                    {/* Step description */}
                    <div className="space-y-1 text-center">
                      <h4 className="text-xs font-bold text-slate-700">តេស្តជាមួយកូដពិសោធន៍ (Demo QR Code Testing)</h4>
                      <p className="text-[10px] text-slate-400 leading-relaxed">
                        លោកអ្នកអាចសាកល្បងមុខងារស្កេននេះបានភ្លាមៗ ដោយមិនបាច់ត្រូវការកាមេរ៉ា ឬកាតរូបវ័ន្តដោយគ្រាន់តែជ្រើសរើសព័ត៌មានភ្ញៀវគំរូខាងក្រោម៖
                      </p>
                    </div>

                    {/* Selector of profiles */}
                    <div className="grid grid-cols-3 gap-1.5">
                      {DEMO_PROFILES.map((profile) => (
                        <button
                          key={profile.id}
                          onClick={() => { setSelectedDemoProfile(profile); setSuccessData(null); setError(null); }}
                          className={`py-2 px-1 text-center rounded-xl border text-[10px] font-bold transition-all cursor-pointer ${
                            selectedDemoProfile.id === profile.id
                              ? "bg-pink-50 border-pink-200 text-pink-700 shadow-xs"
                              : "bg-slate-50 border-slate-150 text-slate-600 hover:bg-slate-100"
                          }`}
                        >
                          <div className="truncate">{profile.name}</div>
                          <div className="text-[8px] text-slate-400 mt-0.5">{profile.relation_type}</div>
                        </button>
                      ))}
                    </div>

                    {/* QR Code generator visualization */}
                    <div className="p-4 border border-slate-150 rounded-2xl bg-slate-50 flex flex-col items-center justify-center text-center space-y-3">
                      <div className="relative w-36 h-36 border-4 border-white bg-white shadow-md rounded-xl overflow-hidden group">
                        <img
                          src={getDemoQrUrl(selectedDemoProfile)}
                          alt="Demo QR Code"
                          className="w-full h-full object-contain"
                          referrerPolicy="no-referrer"
                        />
                        {simulatingScan && (
                          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs flex flex-col items-center justify-center text-white space-y-1">
                            <RefreshCw className="w-6 h-6 animate-spin text-pink-400" />
                            <span className="text-[9px] font-bold">កំពុងធ្វើត្រាប់ស្កេន...</span>
                          </div>
                        )}
                      </div>

                      <div className="space-y-1 text-center w-full">
                        <div className="text-[10px] font-bold text-slate-500 font-serif">ភ្ញៀវកិត្តិយស៖ {selectedDemoProfile.name} ({selectedDemoProfile.phone})</div>
                        <p className="text-[8px] text-slate-400 italic font-serif">កូដ QR ខាងលើលាក់ព័ត៌មាន JSON របស់ភ្ញៀវពេញលេញ</p>
                      </div>

                      {/* Download option & Instant auto-fill simulation buttons */}
                      <div className="flex gap-1.5 w-full">
                        <a
                          href={getDemoQrUrl(selectedDemoProfile)}
                          download={`wedding_invitation_${selectedDemoProfile.name}.png`}
                          target="_blank"
                          rel="noreferrer"
                          className="flex-1 flex items-center justify-center gap-1 px-2.5 py-1.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-650 rounded-lg text-[10px] font-bold transition-all shadow-2xs"
                        >
                          <Download className="w-3.5 h-3.5 text-slate-400" />
                          <span>ទាញយកកូដ</span>
                        </a>

                        <button
                          onClick={handleSimulateScan}
                          disabled={simulatingScan}
                          className="flex-1 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white font-bold px-2.5 py-1.5 rounded-lg text-[10px] transition-all cursor-pointer shadow-xs flex items-center justify-center gap-1"
                        >
                          <RefreshCw className={`w-3.5 h-3.5 ${simulatingScan ? 'animate-spin' : ''}`} />
                          <span>ស្កេនសាកល្បងភ្លាមៗ</span>
                        </button>
                      </div>
                    </div>

                  </div>
                )}

                {/* Display Errors */}
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3 bg-rose-50 border border-rose-100 rounded-xl flex items-start gap-2.5 text-[11px] text-rose-600 font-medium leading-relaxed"
                  >
                    <AlertTriangle className="w-4.5 h-4.5 shrink-0 text-rose-500 mt-0.5" />
                    <span>{error}</span>
                  </motion.div>
                )}

              </div>
            )}
          </div>

          {/* Footer - helpful note */}
          <div className="p-4 bg-slate-50 border-t border-slate-100 text-center text-[10px] text-slate-400 font-medium flex items-center justify-center gap-1">
            <Sparkles className="w-3 h-3 text-pink-400 shrink-0" />
            <span>គំនិតផ្ដួចផ្ដើមទំនើបកម្មអាពាហ៍ពិពាហ៍បែបបច្ចេកវិទ្យា</span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
