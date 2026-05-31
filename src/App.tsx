/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import * as XLSX from "xlsx";
import {
  Heart,
  Users,
  Phone,
  Plus,
  Search,
  Trash2,
  CheckCircle2,
  DollarSign,
  Database,
  Lock,
  User,
  LogOut,
  FileSpreadsheet,
  Check,
  Calendar,
  Sparkles,
  Info,
  X,
  AlertTriangle,
  QrCode,
  Download
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
// @ts-ignore
import bakongLogo from "./bakong.webp";
import QrInvitationScanner, { ScannedInvitation } from "./components/QrInvitationScanner";

// ==========================================
// Types & Schemas
// ==========================================
export interface Admin {
  id: string;
  username: string;
  password?: string;
}

export interface Wedding {
  id: string;
  title: string;
  host_username: string;
  host_password?: string;
  khqr_img_url: string;
  created_at?: string;
}

export interface Guest {
  id: string;
  wedding_id: string;
  name: string;
  phone: string;
  companions: number;
  relation_type: string;
  amount: number;
  note: string;
  status: "pending" | "approved";
  created_at: string;
}

// ==========================================
// Seed Data for Local / Offline Demo Mode
// ==========================================
const DEFAULT_REAL_TIME = "2026-05-28T14:01:15Z";

const SEED_ADMINS: Admin[] = [
  { id: "admin-1", username: "admin123", password: "password123" }
];

const SEED_WEDDINGS: Wedding[] = [
  {
    id: "wedding-1",
    title: "ពិធីមង្គលការ សិរីសួស្តីអាពាហ៍ពិពាហ៍ សុខា និង ចិន្តា",
    host_username: "wedding123",
    host_password: "host123",
    khqr_img_url: "https://i.ibb.co/3s6qCg3/khqr-demo.png" // Standard KHQR demo template
  },
  {
    id: "wedding-2",
    title: "ពិធីមង្គលការ កល្យាណមង្គល វឌ្ឍនៈ និង ម៉ាលីស",
    host_username: "host456",
    host_password: "hostpassword",
    khqr_img_url: "https://i.ibb.co/3s6qCg3/khqr-demo.png"
  }
];

const SEED_GUESTS: Guest[] = [
  {
    id: "guest-1",
    wedding_id: "wedding-1",
    name: "ចាន់ សុភ័ក្រ",
    phone: "012345678",
    companions: 2,
    relation_type: "ខាងកូនកំលោះ",
    amount: 50,
    note: "សូមជូនពរឱ្យអ្នកទាំងពីរស្រឡាញ់គ្នាដល់ចាស់កោងខ្នង ទទួលបានសុភមង្គលឥតឧបមា!",
    status: "approved",
    created_at: "2026-05-28T10:00:00Z"
  },
  {
    id: "guest-2",
    wedding_id: "wedding-1",
    name: "លី ម៉ារីណា",
    phone: "099887766",
    companions: 0,
    relation_type: "ខាងកូនក្រមុំ",
    amount: 30,
    note: "រីករាយថ្ងៃអាពាហ៍ពិពាហ៍! ជូនពរទទួលបានកូនប្រុសស្រីឆាប់ៗ។",
    status: "pending",
    created_at: "2026-05-28T12:30:15Z"
  },
  {
    id: "guest-3",
    wedding_id: "wedding-1",
    name: "កែវ រតនៈ",
    phone: "088123456",
    companions: 1,
    relation_type: "មិត្តភក្តិ",
    amount: 100,
    note: "រីករាយណាស់បានចូលរួមពិធីមង្គលការមិត្តសម្លាញ់! ជូនពររាប់ឆ្នាំ!",
    status: "approved",
    created_at: "2026-05-28T13:45:00Z"
  },
  {
    id: "guest-4",
    wedding_id: "wedding-2",
    name: "សឿន ធីតា",
    phone: "077555666",
    companions: 3,
    relation_type: "ផ្សេងៗ",
    amount: 40,
    note: "សូមអបអរសាទរគូស្វាមីភរិយាថ្មី!",
    status: "approved",
    created_at: "2026-05-28T11:15:00Z"
  }
];

// ==========================================
// SUPABASE SQL SCHEMA FOR REFERENCE & EASY COPYING
// ==========================================
const SUPABASE_SQL_SCHEMA = `-- =====================================================================
-- SUPABASE POSTGRESQL SCHEMA SETUP SCRIPT
-- =====================================================================
-- Application: Wedding Guest Manager (Khmer Unicode Typography)
-- Description: Create tables, enable RLS, and add public policies for easy prototyping.
-- Location: /src/supabase_setup.sql
-- =====================================================================

-- 1. Create tables
-- Admins table
CREATE TABLE IF NOT EXISTS public.admins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Weddings table
CREATE TABLE IF NOT EXISTS public.weddings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    host_username VARCHAR(100) UNIQUE NOT NULL,
    host_password VARCHAR(255) NOT NULL,
    khqr_img_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Guests table
CREATE TABLE IF NOT EXISTS public.guests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wedding_id UUID REFERENCES public.weddings(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(100) NOT NULL,
    companions INTEGER DEFAULT 0 NOT NULL,
    relation_type VARCHAR(100) NOT NULL, -- e.g., 'ខាងកូនកំលោះ', 'ខាងកូនក្រមុំ', 'មិត្តភក្តិ', 'ផ្សេងៗ'
    amount NUMERIC DEFAULT 0.00 NOT NULL,
    note TEXT,
    status VARCHAR(50) DEFAULT 'pending' NOT NULL, -- 'pending' or 'approved'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Seed default admin (username: admin123, password: password123)
-- Seed standard credentials for local or test environments
INSERT INTO public.admins (username, password)
VALUES ('admin123', 'password123')
ON CONFLICT (username) DO NOTHING;

-- Seed a default wedding event for testing (host_username: wedding123, host_password: host123)
INSERT INTO public.weddings (title, host_username, host_password, khqr_img_url)
VALUES (
    'ពិធីសិរីសួស្តីអាពាហ៍ពិពាហ៍ សុខា និង ចិន្តា', 
    'wedding123', 
    'host123', 
    'https://i.ibb.co/3s6qCg3/khqr-demo.png' -- ImgBB/Demo placeholder
)
ON CONFLICT (host_username) DO NOTHING;

-- 3. Enable Row Level Security (RLS)
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weddings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guests ENABLE ROW LEVEL SECURITY;

-- 4. Create Permissive Public Policies for Prototype Access
-- Standard setup for dev/prototype clients using database anon/service keys

-- Drop existing policies if they exist (to allow safe re-running of this script)
DROP POLICY IF EXISTS "Allow public read on Admins" ON public.admins;
DROP POLICY IF EXISTS "Allow public insert on Admins" ON public.admins;
DROP POLICY IF EXISTS "Allow public update on Admins" ON public.admins;
DROP POLICY IF EXISTS "Allow public delete on Admins" ON public.admins;

DROP POLICY IF EXISTS "Allow public read on Weddings" ON public.weddings;
DROP POLICY IF EXISTS "Allow public insert on Weddings" ON public.weddings;
DROP POLICY IF EXISTS "Allow public update on Weddings" ON public.weddings;
DROP POLICY IF EXISTS "Allow public delete on Weddings" ON public.weddings;

DROP POLICY IF EXISTS "Allow public read on Guests" ON public.guests;
DROP POLICY IF EXISTS "Allow public insert on Guests" ON public.guests;
DROP POLICY IF EXISTS "Allow public update on Guests" ON public.guests;
DROP POLICY IF EXISTS "Allow public delete on Guests" ON public.guests;

-- Admins public policies
CREATE POLICY "Allow public read on Admins" ON public.admins FOR SELECT USING (true);
CREATE POLICY "Allow public insert on Admins" ON public.admins FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on Admins" ON public.admins FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Allow public delete on Admins" ON public.admins FOR DELETE USING (true);

-- Weddings public policies
CREATE POLICY "Allow public read on Weddings" ON public.weddings FOR SELECT USING (true);
CREATE POLICY "Allow public insert on Weddings" ON public.weddings FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on Weddings" ON public.weddings FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Allow public delete on Weddings" ON public.weddings FOR DELETE USING (true);

-- Guests public policies
CREATE POLICY "Allow public read on Guests" ON public.guests FOR SELECT USING (true);
CREATE POLICY "Allow public insert on Guests" ON public.guests FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on Guests" ON public.guests FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Allow public delete on Guests" ON public.guests FOR DELETE USING (true);
`;

export default function App() {
  // ==========================================
  // States: Database Config
  // ==========================================
  const [copiedSql, setCopiedSql] = useState<boolean>(false);
  
  const handleCopySql = () => {
    navigator.clipboard.writeText(SUPABASE_SQL_SCHEMA);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2000);
  };

  const [supabaseUrl, setSupabaseUrl] = useState<string>(() => {
    return (
      localStorage.getItem("wedding_supabase_url") ||
      (window as any).env?.SUPABASE_URL ||
      (import.meta as any).env?.VITE_SUPABASE_URL ||
      ""
    );
  });

  const [supabaseAnonKey, setSupabaseAnonKey] = useState<string>(() => {
    return (
      localStorage.getItem("wedding_supabase_key") ||
      (window as any).env?.SUPABASE_ANON_KEY ||
      (import.meta as any).env?.VITE_SUPABASE_ANON_KEY ||
      ""
    );
  });

  const [dbMode, setDbMode] = useState<"demo" | "supabase">(() => {
    const saved = localStorage.getItem("wedding_db_mode");
    if (saved === "supabase") return "supabase";
    return "demo";
  });

  const [showConfig, setShowConfig] = useState<boolean>(false);
  const [supabaseError, setSupabaseError] = useState<string | null>(null);

  // Initialize Supabase Client dynamically
  const [supabase, setSupabase] = useState<any>(null);

  useEffect(() => {
    if (dbMode === "supabase" && supabaseUrl && supabaseAnonKey) {
      try {
        const client = createClient(supabaseUrl, supabaseAnonKey);
        setSupabase(client);
        setSupabaseError(null);
      } catch (err: any) {
        setSupabaseError(err?.message || "បរាជ័យក្នុងការភ្ជាប់ទៅកាន់ Supabase Client");
        setDbMode("demo");
      }
    } else {
      setSupabase(null);
    }
  }, [dbMode, supabaseUrl, supabaseAnonKey]);

  // Save Config to storage
  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabaseUrl || !supabaseAnonKey) {
      alert("សូមបញ្ចូល Supabase URL និង Anon Key ឱ្យបានត្រឹមត្រូវ!");
      return;
    }
    localStorage.setItem("wedding_supabase_url", supabaseUrl);
    localStorage.setItem("wedding_supabase_key", supabaseAnonKey);
    localStorage.setItem("wedding_db_mode", "supabase");
    setDbMode("supabase");
    setShowConfig(false);
    loadData();
  };

  const handleUseDemo = () => {
    localStorage.setItem("wedding_db_mode", "demo");
    setDbMode("demo");
    setShowConfig(false);
    loadData();
  };

  // ==========================================
  // InMemory Data State (for local mode & caching Supabase results)
  // ==========================================
  const [admins, setAdmins] = useState<Admin[]>(() => {
    const saved = localStorage.getItem("wedding_local_admins");
    return saved ? JSON.parse(saved) : SEED_ADMINS;
  });

  const [weddings, setWeddings] = useState<Wedding[]>(() => {
    const saved = localStorage.getItem("wedding_local_weddings");
    return saved ? JSON.parse(saved) : SEED_WEDDINGS;
  });

  const [guests, setGuests] = useState<Guest[]>(() => {
    const saved = localStorage.getItem("wedding_local_guests");
    return saved ? JSON.parse(saved) : SEED_GUESTS;
  });

  // Save local data to localStorage when state changes (for local persistence)
  useEffect(() => {
    localStorage.setItem("wedding_local_admins", JSON.stringify(admins));
  }, [admins]);

  useEffect(() => {
    localStorage.setItem("wedding_local_weddings", JSON.stringify(weddings));
  }, [weddings]);

  useEffect(() => {
    localStorage.setItem("wedding_local_guests", JSON.stringify(guests));
  }, [guests]);

  // Loading indicator
  const [loading, setLoading] = useState<boolean>(false);

  // Load Data from Supabase if active
  const loadData = async () => {
    if (dbMode === "supabase" && supabaseUrl && supabaseAnonKey) {
      setLoading(true);
      try {
        const client = createClient(supabaseUrl, supabaseAnonKey);
        
        // Fetch admins
        const { data: dbAdmins, error: errAdmins } = await client
          .from("admins")
          .select("*");
        if (errAdmins) throw errAdmins;

        // Fetch weddings
        const { data: dbWeddings, error: errWeddings } = await client
          .from("weddings")
          .select("*")
          .order("created_at", { ascending: false });
        if (errWeddings) throw errWeddings;

        // Fetch guests
        const { data: dbGuests, error: errGuests } = await client
          .from("guests")
          .select("*")
          .order("created_at", { ascending: false });
        if (errGuests) throw errGuests;

        if (dbAdmins) setAdmins(dbAdmins);
        if (dbWeddings) setWeddings(dbWeddings);
        if (dbGuests) setGuests(dbGuests);
        setSupabaseError(null);
      } catch (err: any) {
        console.error("Error loading data from Supabase:", err);
        setSupabaseError(err?.message || "បរាជ័យក្នុងការទាញយកទិន្នន័យពី Supabase Database។ ប្រព័ន្ធបានប្តូរទៅកាន់ Demo Mode ដោយស្វ័យប្រវត្ត។");
        setDbMode("demo");
      } finally {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    loadData();
  }, [dbMode]);

  // ==========================================
  // Router Setup
  // ==========================================
  // Active View Tab: 'guest' (Public), 'admin' (Wedding Coordinator), 'host' (Groom/Bride Owner)
  const [activeTab, setActiveTab] = useState<"guest" | "admin" | "host" >("guest");

  // Selected Wedding (defaults to first wedding)
  const [selectedWeddingId, setSelectedWeddingId] = useState<string>("");

  useEffect(() => {
    if (weddings.length > 0 && !selectedWeddingId) {
      setSelectedWeddingId(weddings[0].id);
    }
  }, [weddings, selectedWeddingId]);

  const activeWedding = weddings.find((w) => w.id === selectedWeddingId) || weddings[0];

  // ==========================================
  // STATE: Public Guest View Registration
  // ==========================================
  const [guestName, setGuestName] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [guestCompanions, setGuestCompanions] = useState<number>(0);
  const [relationType, setRelationType] = useState("មិត្តភក្តិ");
  const [giftAmount, setGiftAmount] = useState("");
  const [guestNote, setGuestNote] = useState("");
  const [showRsvpSuccess, setShowRsvpSuccess] = useState(false);
  const [submittingRsvp, setSubmittingRsvp] = useState(false);
  const [lastSubmittedId, setLastSubmittedId] = useState<string | null>(null);

  const [isQrScannerOpen, setIsQrScannerOpen] = useState(false);

  const handleQrScanSuccess = (data: ScannedInvitation) => {
    if (data.name) setGuestName(data.name);
    if (data.phone) setGuestPhone(data.phone);
    if (data.companions !== undefined) setGuestCompanions(data.companions);
    if (data.relation_type) {
      const allowedRelations = ["ខាងកូនកំលោះ", "ខាងកូនក្រមុំ", "មិត្តភក្តិ", "ផ្សេងៗ"];
      if (allowedRelations.includes(data.relation_type)) {
        setRelationType(data.relation_type);
      }
    }
    if (data.amount !== undefined) setGiftAmount(String(data.amount));
    if (data.note) setGuestNote(data.note);
  };

  const handleGuestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestName.trim()) {
      alert("សូមបញ្ជាក់ឈ្មោះរបស់អ្នក!");
      return;
    }
    if (!guestPhone.trim()) {
      alert("សូមបញ្ជាក់លេខទូរស័ព្ទរបស់អ្នក!");
      return;
    }

    setSubmittingRsvp(true);
    const newGuest: Omit<Guest, "id" | "created_at"> = {
      wedding_id: selectedWeddingId || (weddings[0]?.id || "demo-w1"),
      name: guestName.trim(),
      phone: guestPhone.trim(),
      companions: Number(guestCompanions),
      relation_type: relationType,
      amount: giftAmount ? Number(giftAmount) : 0,
      note: guestNote.trim(),
      status: "pending"
    };

    if (dbMode === "supabase" && supabase) {
      try {
        const { data, error } = await supabase
          .from("guests")
          .insert([newGuest])
          .select();
        
        if (error) throw error;
        
        if (data && data[0]) {
          setLastSubmittedId(data[0].id);
        }
        await loadData();
        setShowRsvpSuccess(true);
        resetGuestForm();
      } catch (err: any) {
        alert("កំហុសក្នុងការចុះឈ្មោះបុគ្គល៖ " + (err.message || err));
      } finally {
        setSubmittingRsvp(false);
      }
    } else {
      // Local Mode
      const localId = "guest-" + Date.now();
      const createdGuest: Guest = {
        ...newGuest,
        id: localId,
        created_at: new Date().toISOString()
      };
      setGuests((prev) => [createdGuest, ...prev]);
      setLastSubmittedId(localId);
      setShowRsvpSuccess(true);
      resetGuestForm();
      setSubmittingRsvp(false);
    }
  };

  const resetGuestForm = () => {
    setGuestName("");
    setGuestPhone("");
    setGuestCompanions(0);
    setRelationType("មិត្តភក្តិ");
    setGiftAmount("");
    setGuestNote("");
  };

  // ==========================================
  // STATE: Admin Dashboard login & management
  // ==========================================
  const [adminUsername, setAdminUsername] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [adminSearchQuery, setAdminSearchQuery] = useState("");
  const [adminStatusFilter, setAdminStatusFilter] = useState<"all" | "pending" | "approved">("all");
  
  // Create New Wedding State
  const [newWeddingTitle, setNewWeddingTitle] = useState("");
  const [newWeddingHostUser, setNewWeddingHostUser] = useState("");
  const [newWeddingHostPass, setNewWeddingHostPass] = useState("");
  const [newWeddingKhqrUrl, setNewWeddingKhqrUrl] = useState("");
  const [showAddWeddingForm, setShowAddWeddingForm] = useState(false);
  const [creatingWedding, setCreatingWedding] = useState(false);

  // Manual Add Guest (Admin View)
  const [manualName, setManualName] = useState("");
  const [manualPhone, setManualPhone] = useState("");
  const [manualCompanions, setManualCompanions] = useState<number>(0);
  const [manualRelation, setManualRelation] = useState("មិត្តភក្តិ");
  const [manualAmount, setManualAmount] = useState("");
  const [manualNote, setManualNote] = useState("");
  const [showManualAddForm, setShowManualAddForm] = useState(false);
  const [addingManualGuest, setAddingManualGuest] = useState(false);

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const found = admins.find(
      (a) => a.username === adminUsername && a.password === adminPassword
    );
    if (found) {
      setIsAdminLoggedIn(true);
      setAdminUsername("");
      setAdminPassword("");
    } else {
      alert("គណនី ឬលេខសម្ងាត់របស់គណៈកម្មការមិនត្រឹមត្រូវទេ!");
    }
  };

  const handleCreateWedding = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWeddingTitle.trim() || !newWeddingHostUser.trim() || !newWeddingHostPass.trim()) {
      alert("សូមបំពេញព័ត៌មានចាំបាច់ឱ្យបានគ្រប់គ្រាន់!");
      return;
    }

    setCreatingWedding(true);
    const newW: Omit<Wedding, "id"> = {
      title: newWeddingTitle.trim(),
      host_username: newWeddingHostUser.trim(),
      host_password: newWeddingHostPass.trim(),
      khqr_img_url: newWeddingKhqrUrl.trim() || "https://i.ibb.co/3s6qCg3/khqr-demo.png"
    };

    if (dbMode === "supabase" && supabase) {
      try {
        const { data, error } = await supabase
          .from("weddings")
          .insert([newW])
          .select();
        
        if (error) throw error;
        if (data && data[0]) {
          setSelectedWeddingId(data[0].id);
        }
        await loadData();
        setShowAddWeddingForm(false);
        setNewWeddingTitle("");
        setNewWeddingHostUser("");
        setNewWeddingHostPass("");
        setNewWeddingKhqrUrl("");
        alert("បានបង្កើតកម្មវិធីមង្គលការថ្មីដោយជោគជ័យ! 🎉");
      } catch (err: any) {
        alert("កំហុសក្នុងការបង្កើតមង្គលការ៖ " + (err.message || err));
      } finally {
        setCreatingWedding(false);
      }
    } else {
      // Local Mode
      const localId = "wedding-" + Date.now();
      const createdWedding: Wedding = {
        ...newW,
        id: localId,
        created_at: new Date().toISOString()
      };
      setWeddings((prev) => [createdWedding, ...prev]);
      setSelectedWeddingId(localId);
      setShowAddWeddingForm(false);
      setNewWeddingTitle("");
      setNewWeddingHostUser("");
      setNewWeddingHostPass("");
      setNewWeddingKhqrUrl("");
      alert("បានបង្កើតកម្មវិធីមង្គលការថ្មីដោយជោគជ័យ (Local Mode)! 🎉");
      setCreatingWedding(false);
    }
  };

  const handleManualAddGuest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualName.trim() || !manualPhone.trim()) {
      alert("សូមបញ្ចូលឈ្មោះ និងលេខទូរស័ព្ទភ្ញៀវ!");
      return;
    }

    setAddingManualGuest(true);
    const newGuest: Omit<Guest, "id" | "created_at"> = {
      wedding_id: selectedWeddingId,
      name: manualName.trim(),
      phone: manualPhone.trim(),
      companions: Number(manualCompanions),
      relation_type: manualRelation,
      amount: manualAmount ? Number(manualAmount) : 0,
      note: manualNote.trim(),
      status: "approved" // Automatically approved when added by Admin/Coordinator
    };

    if (dbMode === "supabase" && supabase) {
      try {
        const { error } = await supabase.from("guests").insert([newGuest]);
        if (error) throw error;
        await loadData();
        setShowManualAddForm(false);
        resetManualForm();
        alert("បានបន្ថែមភ្ញៀវដោយជោគជ័យ! 🎉");
      } catch (err: any) {
        alert("កំហុសក្នុងការបញ្ចូលភ្ញៀវ៖ " + (err.message || err));
      } finally {
        setAddingManualGuest(false);
      }
    } else {
      // Local Mode
      const createdGuest: Guest = {
        ...newGuest,
        id: "guest-" + Date.now(),
        created_at: new Date().toISOString()
      };
      setGuests((prev) => [createdGuest, ...prev]);
      setShowManualAddForm(false);
      resetManualForm();
      alert("បានបន្ថែមភ្ញៀវដោយជោគជ័យ (Local Mode)! 🎉");
      setAddingManualGuest(false);
    }
  };

  const resetManualForm = () => {
    setManualName("");
    setManualPhone("");
    setManualCompanions(0);
    setManualRelation("មិត្តភក្តិ");
    setManualAmount("");
    setManualNote("");
  };

  const handleApproveGuest = async (guestId: string) => {
    if (dbMode === "supabase" && supabase) {
      try {
        const { error } = await supabase
          .from("guests")
          .update({ status: "approved" })
          .eq("id", guestId);
        if (error) throw error;
        await loadData();
      } catch (err: any) {
        alert("កំហុសក្នុងការបញ្ជាក់ភ្ញៀវ៖ " + (err.message || err));
      }
    } else {
      setGuests((prev) =>
        prev.map((g) => (g.id === guestId ? { ...g, status: "approved" } : g))
      );
    }
  };

  const handleDeleteGuest = async (guestId: string) => {
    if (!confirm("តើអ្នកពិតជាចង់លុបទិន្នន័យភ្ញៀវម្នាក់នេះមែនទេ?")) return;

    if (dbMode === "supabase" && supabase) {
      try {
        const { error } = await supabase.from("guests").delete().eq("id", guestId);
        if (error) throw error;
        await loadData();
      } catch (err: any) {
        alert("កំហុសក្នុងការលុបទិន្នន័យភ្ញៀវ៖ " + (err.message || err));
      }
    } else {
      setGuests((prev) => prev.filter((g) => g.id !== guestId));
    }
  };

  // ==========================================
  // STATE: Host Dashboard login & reports
  // ==========================================
  const [hostUsername, setHostUsername] = useState("");
  const [hostPassword, setHostPassword] = useState("");
  const [currentHostWedding, setCurrentHostWedding] = useState<Wedding | null>(null);
  const [hostSearchQuery, setHostSearchQuery] = useState("");

  const handleHostLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const found = weddings.find(
      (w) => w.host_username === hostUsername && w.host_password === hostPassword
    );
    if (found) {
      setCurrentHostWedding(found);
      setSelectedWeddingId(found.id);
      setHostUsername("");
      setHostPassword("");
    } else {
      alert("គណនី ឬលេខសម្ងាត់របស់ម្ចាស់ពិធីមិនត្រឹមត្រូវទេ!");
    }
  };

  // Export to Excel Engine (SheetJS)
  const exportToExcel = (guestsList: Guest[], weddingTitle: string) => {
    const data = guestsList.map((g, index) => ({
      "ល.រ (No.)": index + 1,
      "ឈ្មោះភ្ញៀវ (Guest Name)": g.name,
      "លេខទូរស័ព្ទ (Phone Number)": g.phone,
      "ចំនួនអ្នកមកជាមួយ (Companions)": g.companions,
      "ប្រភេទទំនាក់ទំនង (Relation)": g.relation_type,
      "ទឹកប្រាក់ចងដៃ $ (Gift Amount)": g.amount,
      "កំណត់សម្គាល់/ពរជ័យ (Notes)": g.note || "",
      "ស្ថានភាព (Status)": g.status === "approved" ? "យល់ព្រម (Approved)" : "រង់ចាំការបញ្ជាក់ (Pending)",
      "កាលបរិច្ឆេទចុះឈ្មោះ (Date)": g.created_at ? new Date(g.created_at).toLocaleString("kh-KH") : ""
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    
    // Auto fit column widths
    const max_widths = Object.keys(data[0] || {}).map((key) => {
      return { wch: Math.max(key.length * 1.5, 15) };
    });
    worksheet["!cols"] = max_widths;

    XLSX.utils.book_append_sheet(workbook, worksheet, "បញ្ជីភ្ញៀវកិត្តិយស");
    XLSX.writeFile(workbook, `បញ្ជីភ្ញៀវ_${weddingTitle.replace(/\s+/g, "_")}.xlsx`);
  };

  // Filter & Search Logic for Admin
  const adminFilteredGuests = guests.filter((g) => {
    if (g.wedding_id !== selectedWeddingId) return false;
    const matchesSearch =
      g.name.toLowerCase().includes(adminSearchQuery.toLowerCase()) ||
      g.phone.includes(adminSearchQuery);
    const matchesStatus =
      adminStatusFilter === "all" ? true : g.status === adminStatusFilter;
    return matchesSearch && matchesStatus;
  });

  // Filter & Search Logic for Host
  const hostFilteredGuests = currentHostWedding
    ? guests.filter((g) => {
        if (g.wedding_id !== currentHostWedding.id) return false;
        return (
          g.name.toLowerCase().includes(hostSearchQuery.toLowerCase()) ||
          g.phone.includes(hostSearchQuery)
        );
      })
    : [];

  // ==========================================
  // Metrics Calculation for Host
  // ==========================================
  const totalRegisteredGuests = hostFilteredGuests.length;
  
  // Actual attendees = count of approved guests + companions of APPROVED guests
  const approvedGuests = hostFilteredGuests.filter((g) => g.status === "approved");
  const actualTotalAttendees = approvedGuests.reduce(
    (sum, g) => sum + 1 + g.companions,
    0
  );

  // Total Gift amount in USD for approved guests
  const totalGiftAmount = approvedGuests.reduce((sum, g) => sum + g.amount, 0);

  return (
    <div className="min-h-screen flex flex-col font-sans selection:bg-pink-100 selection:text-pink-900 bg-pink-50/20 text-slate-800">
      
      {/* ==========================================
          Header Navigation App
          ========================================== */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-pink-100 shadow-sm px-4 py-3 md:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-pink-500 rounded-full flex items-center justify-center shadow-lg shadow-pink-200">
            <Heart className="w-5 h-5 text-white fill-white" />
          </div>
          <div>
            <h1 className="text-lg md:text-xl font-bold text-slate-900 tracking-tight font-serif flex items-center gap-2">
              ប្រព័ន្ធគ្រប់គ្រងភ្ញៀវមង្គលការ <span className="text-[10px] text-pink-600 font-sans font-bold border border-pink-200/60 bg-pink-50 px-2 py-0.5 rounded-full">គម្រោងគំរូ</span>
            </h1>
            <p className="text-xs text-slate-400 font-sans font-medium">
              ចុះឈ្មោះ គ្រប់គ្រងគណនីចងដៃ និងរបាយការណ៍សង្ខេប
            </p>
          </div>
        </div>

        {/* Navigation Tabs Switcher */}
        <div className="flex bg-slate-100/80 p-1 rounded-2xl w-full md:w-auto max-w-sm shadow-inner border border-pink-150/20">
          <button
            id={`nav-btn-guest`}
            onClick={() => setActiveTab("guest")}
            className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-bold tracking-wide transition-all duration-200 cursor-pointer ${
              activeTab === "guest"
                ? "bg-white text-pink-600 shadow-xs border border-pink-100/30"
                : "text-slate-500 hover:text-slate-900"
            }`}
          >
            <User className="w-3.5 h-3.5" />
            ភ្ញៀវកិត្តិយស (Public)
          </button>
          
          <button
            id={`nav-btn-admin`}
            onClick={() => setActiveTab("admin")}
            className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-bold tracking-wide transition-all duration-200 cursor-pointer ${
              activeTab === "admin"
                ? "bg-white text-pink-600 shadow-xs border border-pink-100/30"
                : "text-slate-500 hover:text-slate-900"
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            គណៈកម្មការ (Admin)
          </button>

          <button
            id={`nav-btn-host`}
            onClick={() => setActiveTab("host")}
            className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-bold tracking-wide transition-all duration-200 cursor-pointer ${
              activeTab === "host"
                ? "bg-white text-pink-600 shadow-xs border border-pink-100/30"
                : "text-slate-500 hover:text-slate-900"
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            ម្ចាស់ពិធី (Host)
          </button>
        </div>

        {/* Database Status and Bakong Widget */}
        <div className="flex items-center gap-2.5">
          {/* Bakong Logo Badge */}
          <div className="flex items-center gap-1.5 bg-red-550/10 border border-red-500/20 px-3 py-1.5 rounded-full shadow-xs">
            <img src={bakongLogo} alt="Bakong" className="w-4 h-4 object-contain rounded-full" />
            <span className="text-[10px] font-bold text-red-600 tracking-wide font-sans">Bakong Enabled</span>
          </div>

          <button
            id="db-config-toggle"
            onClick={() => setShowConfig(!showConfig)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold transition-all cursor-pointer ${
              dbMode === "supabase"
                ? "bg-green-50 text-emerald-700 border border-green-200/50"
                : "bg-pink-50 text-pink-700 border border-pink-200/40"
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>{dbMode === "supabase" ? "Supabase Connected" : "Local Demo Mode"}</span>
          </button>
        </div>
      </header>

      {/* ==========================================
          Database Configuration Panel (Slide down drawer)
          ========================================== */}
      <AnimatePresence>
        {showConfig && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-slate-900 text-slate-200 border-b border-slate-800 overflow-hidden"
          >
            <div className="max-w-4xl mx-auto p-6 flex flex-col md:flex-row gap-6 items-start">
              <div className="flex-1">
                <h3 className="text-md font-bold text-white flex items-center gap-2 font-serif">
                  <Database className="w-4 h-4 text-emerald-400" /> ការកំណត់ការតភ្ជាប់បណ្តាញទិន្នន័យ (Database)
                </h3>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                  គម្រោងនេះអាចភ្ជាប់ទៅកាន់ <strong>Supabase Storage</strong> និង <strong>PostgreSQL Database</strong> ពិតប្រាកដ។ 
                  ប្រសិនបើលោកអ្នកគ្មានគណនី Supabase ទេលោកអ្នកអាចសាកល្បងដោយការចុចប៊ូតុង <strong>ប្រើប្រាស់ Demo Mode</strong> ដើម្បីសាកល្បងជាមួយទិន្នន័យគំរូក្នុង Browser របស់អ្នក។
                </p>

                {/* Show Copy SQL Schema Option */}
                <div className="mt-4 p-3 bg-slate-850 border border-slate-800 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-slate-200">Supabase SQL Schema</span>
                    <span className="text-[10px] text-slate-400 mt-0.5">ចម្លងកូដ SQL ធៀបក្នុង SQL Editor របស់ Supabase</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleCopySql}
                    className={`shrink-0 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border duration-200 cursor-pointer ${
                      copiedSql 
                        ? "bg-emerald-600/20 text-emerald-400 border-emerald-500/30" 
                        : "bg-slate-800 hover:bg-slate-750 text-slate-350 border-slate-700/60"
                    }`}
                  >
                    {copiedSql ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>បានចម្លងរួចរាល់!</span>
                      </>
                    ) : (
                      <>
                        <Database className="w-3.5 h-3.5 text-blue-400" />
                        <span>ចម្លង SQL Script</span>
                      </>
                    )}
                  </button>
                </div>

                {supabaseError && (
                  <div className="mt-3 p-2 text-xs bg-red-950 text-red-300 border border-red-800 rounded-lg flex items-start gap-1.5">
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{supabaseError}</span>
                  </div>
                )}
              </div>

              <form onSubmit={handleSaveConfig} className="w-full md:w-96 flex flex-col gap-3 shrink-0">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Supabase URL</label>
                  <input
                    type="url"
                    value={supabaseUrl}
                    onChange={(e) => setSupabaseUrl(e.target.value)}
                    placeholder="https://your-project.supabase.co"
                    className="w-full text-xs px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-hidden focus:border-pink-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Supabase Anon Key</label>
                  <input
                    type="password"
                    value={supabaseAnonKey}
                    onChange={(e) => setSupabaseAnonKey(e.target.value)}
                    placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                    className="w-full text-xs px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-hidden focus:border-pink-500"
                  />
                </div>
                <div className="flex gap-2 mt-1">
                  <button
                    type="submit"
                    className="flex-1 text-xs font-bold bg-pink-600 hover:bg-pink-700 text-white py-2 rounded-lg transition-colors cursor-pointer"
                  >
                    រក្សាទុក & ភ្ជាប់
                  </button>
                  <button
                    type="button"
                    onClick={handleUseDemo}
                    className="flex-1 text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-350 border border-slate-750 py-2 rounded-lg transition-colors cursor-pointer"
                  >
                    ប្រើប្រាស់ Demo Mode
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Demo notice banner */}
      {dbMode === "demo" && (
        <div className="bg-pink-50 border-b border-pink-100/60 px-4 py-2.5 text-center text-xs text-pink-700 font-medium flex items-center justify-center gap-1.5 shadow-sm">
          <Info className="w-4 h-4 shrink-0 text-pink-500" />
          <span>ដំណើរការក្នុង <strong className="font-bold">Demo Mode (LocalStorage)</strong>។ លោកអ្នកអាចកែសម្រួលបានភ្លាមៗ! បើចង់ប្រើ Database ពិតសូមចុចលើប៊ូតុង "Local Demo Mode" ខាងលើ។</span>
        </div>
      )}

      {/* Main Content Arena */}
      <main className="flex-1 max-w-5xl mx-auto w-full p-4 md:p-8">
        
        <AnimatePresence mode="wait">
          
          {/* ==========================================
              TAB 1: GUEST VIEW (PUBLIC RSVP)
              ========================================== */}
          {activeTab === "guest" && (
            <motion.div
              key="guest-tab"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-6"
            >
              {/* Event Intro Header Card */}
              <div className="relative overflow-hidden bg-white border border-pink-100 rounded-3xl p-8 shadow-sm text-center space-y-4">
                <div className="absolute top-0 inset-x-0 h-1.5 bg-pink-500" />
                <div className="inline-block p-3.5 bg-pink-50 rounded-full text-pink-600">
                  <Sparkles className="w-8 h-8 text-pink-500 animate-spin" style={{ animationDuration: "12s" }} />
                </div>
                
                {/* Wedding Selector Dropdown for Guests */}
                <div className="max-w-xs mx-auto">
                  <label className="block text-xs font-bold text-slate-500 mb-2">សូមជ្រើសរើសពិធីមង្គលការដែលត្រូវចូលរួម៖</label>
                  <select
                    id="guest-wedding-select"
                    value={selectedWeddingId}
                    onChange={(e) => setSelectedWeddingId(e.target.value)}
                    className="w-full text-sm font-bold px-3 py-2.5 bg-white border border-pink-100 rounded-xl text-pink-700 text-center focus:outline-hidden focus:border-pink-300"
                  >
                    {weddings.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2 max-w-lg mx-auto">
                  <h2 className="text-2xl md:text-3xl font-bold font-serif text-slate-900 leading-snug">
                    {activeWedding?.title || "ពិធីសិរីសួស្តីអាពាហ៍ពិពាហ៍ សុខា និង ចិន្តា"}
                  </h2>
                  <p className="text-sm text-slate-500 leading-relaxed font-serif">
                    សូមគោរពអញ្ជើញ ឯកឧត្តម លោកជំទាវ លោកជំទាវ លោកលោកស្រី និងប្រិយមិត្តជិតឆ្ងាយទាំងអស់ ចូលរួមចុះឈ្មោះ និងចងដៃជូនពរដល់គូស្វាមីភរិយាថ្មី។
                  </p>
                </div>
              </div>

              {/* Main Content Row: Form & QR Code */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                
                {/* Left Form Panel */}
                <div className="md:col-span-7 bg-white border border-pink-100 rounded-3xl p-6 shadow-xs space-y-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-pink-50 pb-3">
                    <h3 className="text-md font-bold text-slate-800 flex items-center gap-2 font-serif">
                      <Heart className="w-4.5 h-4.5 text-pink-500 fill-pink-500" /> បញ្ចូលព័ត៌មានចុះឈ្មោះកិត្តិយស
                    </h3>
                    <button
                      type="button"
                      onClick={() => setIsQrScannerOpen(true)}
                      className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-pink-50 to-rose-50 hover:from-pink-100 hover:to-rose-100 border border-pink-200/60 rounded-xl text-xs font-bold text-pink-700 hover:text-pink-800 shadow-3xs hover:shadow-2xs leading-none transition-all duration-200 cursor-pointer active:scale-95"
                    >
                      <QrCode className="w-4 h-4 text-pink-500 animate-pulse shrink-0" />
                      <span>ស្កេនកាតអញ្ជើញ (Scan QR)</span>
                    </button>
                  </div>

                  <form onSubmit={handleGuestSubmit} className="space-y-4">
                    
                    {/* Name Input */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        ឈ្មោះភ្ញៀវកិត្តិយស <span className="text-pink-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={guestName}
                        onChange={(e) => setGuestName(e.target.value)}
                        placeholder="ឧ. សុខ និមល"
                        className="w-full text-sm px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:border-pink-500 focus:bg-white transition-all font-medium text-slate-800"
                      />
                    </div>

                    {/* Phone Input */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        លេខទូរស័ព្ទទំនាក់ទំនង <span className="text-pink-500">*</span>
                      </label>
                      <input
                        type="tel"
                        required
                        value={guestPhone}
                        onChange={(e) => setGuestPhone(e.target.value)}
                        placeholder="ឧ. 012 345 678"
                        className="w-full text-sm px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:border-pink-500 focus:bg-white transition-all font-medium text-slate-800"
                      />
                    </div>

                    {/* Numeric Companion Inputs & Increments */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        ចំនួនអ្នកមកជាមួយ (ក្រៅពីសាមីខ្លួន)
                      </label>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setGuestCompanions(Math.max(0, guestCompanions - 1))}
                          className="w-11 h-11 border border-slate-200 rounded-xl flex items-center justify-center bg-slate-50 hover:bg-slate-100 font-bold text-lg text-slate-600 transition-colors cursor-pointer"
                        >
                          -
                        </button>
                        <input
                          type="number"
                          min="0"
                          value={guestCompanions}
                          onChange={(e) => setGuestCompanions(Math.max(0, Number(e.target.value)))}
                          className="flex-1 w-full text-center text-sm py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:border-pink-500 font-bold text-slate-800"
                        />
                        <button
                          type="button"
                          onClick={() => setGuestCompanions(guestCompanions + 1)}
                          className="w-11 h-11 border border-slate-200 rounded-xl flex items-center justify-center bg-slate-50 hover:bg-slate-100 font-bold text-lg text-slate-600 transition-colors cursor-pointer"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    {/* Relation Select via Pills */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        ទំនាក់ទំនងជាមួយម្ចាស់ពិធី
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        {["ខាងកូនកំលោះ", "ខាងកូនក្រមុំ", "មិត្តភក្តិ", "ផ្សេងៗ"].map((rel) => (
                          <button
                            type="button"
                            key={rel}
                            onClick={() => setRelationType(rel)}
                            className={`py-2 px-3 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                              relationType === rel
                                ? "bg-pink-50 border-pink-300 text-pink-700 shadow-xs"
                                : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                            }`}
                          >
                            {rel}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Gift Amount USD Input */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        ចំនួនទឹកប្រាក់ចងដៃ (ដុល្លារអាមេរិក $)
                      </label>
                      <div className="relative">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">
                          $
                        </span>
                        <input
                          type="number"
                          min="0"
                          value={giftAmount}
                          onChange={(e) => setGiftAmount(e.target.value)}
                          placeholder="ឧ. 50"
                          className="w-full text-sm pl-8 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:border-pink-500 focus:bg-white transition-all font-bold text-slate-850"
                        />
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1">
                        (ប្រសិនបើចងដៃដោយការស្កេន KHQR ខាងស្តាំ សូមបញ្ចូលទឹកប្រាក់ដែលបានស្កេន)
                      </p>
                    </div>

                    {/* Notes Input */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        កំណត់សម្គាល់ ឬ ពាក្យជូនពរដល់គូស្វាមីភរិយា
                      </label>
                      <textarea
                        rows={3}
                        value={guestNote}
                        onChange={(e) => setGuestNote(e.target.value)}
                        placeholder="សូមជូនពរឱ្យស្រឡាញ់គ្នាដល់ចាស់កោងខ្នង..."
                        className="w-full text-sm px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:border-pink-500 focus:bg-white transition-all font-medium text-slate-800"
                      />
                    </div>

                    {/* Submit RSVP Button */}
                    <button
                      type="submit"
                      disabled={submittingRsvp}
                      className="w-full bg-pink-600 hover:bg-pink-700 disabled:bg-slate-350 text-white font-bold py-3.5 px-4 rounded-xl shadow-xs hover:shadow-md transition-all duration-200 cursor-pointer flex items-center justify-center gap-2"
                    >
                      {submittingRsvp ? (
                        <>
                          <span className="w-4 h-4 border-2 border-white/35 border-t-white rounded-full animate-spin" />
                          <span>កំពុងបញ្ជូន...</span>
                        </>
                      ) : (
                        <>
                          <Heart className="w-4 h-4 fill-white text-none" />
                          <span>បញ្ជូនការចុះឈ្មោះកិត្តិយស</span>
                        </>
                      )}
                    </button>

                  </form>
                </div>

                {/* Right KHQR QR Code Display */}
                <div className="md:col-span-5 bg-white border border-pink-100 rounded-3xl p-8 shadow-sm flex flex-col justify-between space-y-4">
                  <div className="text-center space-y-1.5">
                    <h3 className="text-md font-bold text-slate-900 font-serif flex items-center justify-center gap-1.5">
                      <QrCode className="w-5 h-5 text-pink-500" /> គណនីស្កេន KHQR ចងដៃ
                    </h3>
                    <p className="text-xs text-slate-400 font-medium leading-relaxed">
                      លោកអ្នកអាចស្កេន KHQR ដើម្បីចងដៃដោយផ្ទាល់ពីគណនីធនាគារ
                    </p>
                  </div>

                  {/* Dynamic ImgBB KHQR URL fetched from Wedding Profile */}
                  <div className="relative aspect-square max-w-xs mx-auto border-2 border-dashed border-pink-200 rounded-2xl overflow-hidden p-2 bg-pink-50/10 flex items-center justify-center">
                    {activeWedding?.khqr_img_url ? (
                      <img
                        id="active-wedding-qr"
                        src={activeWedding.khqr_img_url}
                        alt="KHQR Code"
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <div className="text-center space-y-2 p-4">
                        <QrCode className="w-16 h-16 text-slate-300 mx-auto" />
                        <span className="text-xs text-slate-400 block font-medium">គ្មានរូបភាព KHQR ឡើយ</span>
                      </div>
                    )}
                  </div>

                  {/* Download QR Code Button */}
                  {activeWedding?.khqr_img_url && (
                    <div className="flex justify-center">
                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            // Try to fetch image with CORS settings to force direct download
                            const response = await fetch(activeWedding.khqr_img_url, { mode: "cors" });
                            const blob = await response.blob();
                            const blobUrl = window.URL.createObjectURL(blob);
                            const link = document.createElement("a");
                            link.href = blobUrl;
                            link.download = `KHQR_${activeWedding.title.replace(/\s+/g, "_")}.png`;
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);
                            window.URL.revokeObjectURL(blobUrl);
                          } catch (err) {
                            // CORS / network fallback - open directly
                            const link = document.createElement("a");
                            link.href = activeWedding.khqr_img_url;
                            link.target = "_blank";
                            link.rel = "noopener noreferrer";
                            link.download = `KHQR_${activeWedding.title.replace(/\s+/g, "_")}.png`;
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);
                          }
                        }}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-pink-50 to-rose-50 hover:from-pink-100 hover:to-rose-100 border border-pink-200/60 rounded-xl text-xs font-bold text-pink-700 hover:text-pink-800 shadow-3xs hover:shadow-2xs transition-all duration-200 cursor-pointer active:scale-[0.98]"
                      >
                        <Download className="w-4 h-4 text-pink-500 shrink-0" />
                        <span>ទាញយករូបភាព QR Code (Download QR)</span>
                      </button>
                    </div>
                  )}

                  <div className="bg-pink-50/30 border border-pink-100/60 p-4 rounded-2xl text-center">
                    <p className="text-xs text-slate-600 font-medium leading-relaxed">
                      ស្គែនរួចរាល់ សូមបំពេញចំនួនទឹកប្រាក់ចងដៃនៅក្នុងទម្រង់បែបបទខាងឆ្វេង ហើយចុចប៊ូតុងចុះឈ្មោះ ដើម្បីឱ្យគណៈកម្មការរៀបចំកត់ត្រា និងអនុម័ត។
                    </p>
                  </div>
                </div>

              </div>
            </motion.div>
          )}

          {/* ==========================================
              TAB 2: ADMIN VIEW (COORDINATOR DASHBOARD)
              ========================================== */}
          {activeTab === "admin" && (
            <motion.div
              key="admin-tab"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-6"
            >
              {/* Check Admin Login State */}
              {!isAdminLoggedIn ? (
                <div className="max-w-md mx-auto bg-white border border-pink-100 rounded-3xl p-8 shadow-sm space-y-6">
                  <div className="text-center space-y-2">
                    <div className="inline-block p-3.5 bg-pink-50 text-pink-600 rounded-full shadow-sm shadow-pink-100/50">
                      <Lock className="w-7 h-7" />
                    </div>
                    <h2 className="text-xl font-bold text-slate-900 font-serif">គណនីអ្នករៀបចំការងា (Admin Login)</h2>
                    <p className="text-xs text-slate-400 font-medium">
                      សូមបញ្ចូលគណនី និងលេខសម្ងាត់ត្រឹមត្រូវដើម្បីគ្រប់គ្រង
                    </p>
                  </div>

                  <form onSubmit={handleAdminLogin} className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">ឈ្មោះគណនី (Username)</label>
                      <input
                        type="text"
                        required
                        value={adminUsername}
                        onChange={(e) => setAdminUsername(e.target.value)}
                        placeholder="ឧ. admin123"
                        className="w-full text-sm px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:border-pink-300 transition-all text-slate-800 font-medium"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">លេខសម្ងាត់ (Password)</label>
                      <input
                        type="password"
                        required
                        value={adminPassword}
                        onChange={(e) => setAdminPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full text-sm px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:border-pink-300 transition-all text-slate-800 font-semibold"
                      />
                    </div>
                    
                    <button
                      type="submit"
                      className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 px-4 rounded-xl shadow-md transition-all cursor-pointer text-xs"
                    >
                      ចូលទៅកាន់ប្រព័ន្ធគ្រប់គ្រង
                    </button>
                  </form>

                  <div className="bg-pink-50/50 border border-pink-100/60 rounded-2xl p-4 flex items-start gap-2">
                    <Info className="w-4 h-4 text-pink-700 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-[10px] text-pink-800 font-bold">គណនីគំរូសាកល្បង៖</p>
                      <p className="text-[10px] text-pink-700 font-medium">Username: <strong className="font-bold">admin123</strong> &nbsp;|&nbsp; Password: <strong className="font-bold">password123</strong></p>
                    </div>
                  </div>
                </div>
              ) : (
                /* Admin Dashboard Main Interface */
                <div className="space-y-6">
                  
                  {/* Top Bar Admin Actions */}
                  <div className="bg-white border border-pink-100 rounded-3xl p-6 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-pink-50 text-pink-600 rounded-2xl">
                        <User className="w-5 h-5 text-pink-500" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-900 font-serif">គណនីសមាជិកគណៈកម្មការ៖ admin123</h3>
                        <p className="text-[10px] text-slate-400 font-medium">គ្រប់គ្រង រៀបចំ និងត្រួតពិនិត្យបញ្ជីឈ្មោះភ្ញៀវ</p>
                      </div>
                    </div>

                    <div className="flex gap-2 w-full md:w-auto">
                      <button
                        onClick={() => setShowAddWeddingForm(!showAddWeddingForm)}
                        className="flex-1 md:flex-none flex items-center justify-center gap-1 bg-pink-50 hover:bg-pink-100/80 border border-pink-200/50 text-pink-750 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer"
                      >
                        <Plus className="w-4 h-4" />
                        បង្កើតកម្មវិធីមង្គលការ
                      </button>
                      <button
                        onClick={() => setIsAdminLoggedIn(false)}
                        className="flex-1 md:flex-none flex items-center justify-center gap-1 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer"
                      >
                        <LogOut className="w-4 h-4" />
                        ចាកចេញ
                      </button>
                    </div>
                  </div>

                  {/* Expandable Add Wedding Event Form */}
                  <AnimatePresence>
                    {showAddWeddingForm && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs overflow-hidden"
                      >
                        <h4 className="text-md font-bold text-slate-800 mb-4 border-b pb-2 font-serif flex items-center gap-1.5 text-pink-600">
                          <Sparkles className="w-4 h-4" /> បង្កើតកម្មវិធីពិធីមង្គលការថ្មី
                        </h4>
                        
                        <form onSubmit={handleCreateWedding} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="md:col-span-2">
                            <label className="block text-xs font-bold text-slate-700 mb-1">
                              ឈ្មោះកម្មវិធីពិធីមង្គលការ <span className="text-pink-500">*</span>
                            </label>
                            <input
                              type="text"
                              required
                              value={newWeddingTitle}
                              onChange={(e) => setNewWeddingTitle(e.target.value)}
                              placeholder="ឧ. ពិធីសិរីសួស្តីអាពាហ៍ពិពាហ៍ សុខា និង ចិន្តា"
                              className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:border-pink-500 font-medium text-slate-800"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">
                              គណនីម្ចាស់ពិធី (Host Username) <span className="text-pink-500">*</span>
                            </label>
                            <input
                              type="text"
                              required
                              value={newWeddingHostUser}
                              onChange={(e) => setNewWeddingHostUser(e.target.value)}
                              placeholder="ឧ. host123"
                              className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:border-pink-500 font-semibold"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">
                              លេខសម្ងាត់ (Host Password) <span className="text-pink-500">*</span>
                            </label>
                            <input
                              type="text"
                              required
                              value={newWeddingHostPass}
                              onChange={(e) => setNewWeddingHostPass(e.target.value)}
                              placeholder="ឧ. host_pass"
                              className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:border-pink-500 font-semibold"
                            />
                          </div>

                          <div className="md:col-span-2">
                            <label className="block text-xs font-bold text-slate-700 mb-1">
                              តំណរូបភាព ឬ ImgBB Link របស់ KHQR (ទំហំ ការ៉េ)
                            </label>
                            <input
                              type="url"
                              value={newWeddingKhqrUrl}
                              onChange={(e) => setNewWeddingKhqrUrl(e.target.value)}
                              placeholder="https://i.ibb.co/... ទុកទទេរដើម្បីប្រើរូបភាពគំរូ"
                              className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:border-pink-500"
                            />
                          </div>

                          <div className="md:col-span-2 flex gap-2 justify-end pt-2">
                            <button
                              type="button"
                              onClick={() => setShowAddWeddingForm(false)}
                              className="text-xs font-bold px-4 py-2 border border-slate-250 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                            >
                              បោះបង់
                            </button>
                            <button
                              type="submit"
                              disabled={creatingWedding}
                              className="text-xs bg-pink-600 hover:bg-pink-700 text-white font-bold px-5 py-2 rounded-xl transition-all cursor-pointer"
                            >
                              {creatingWedding ? "កំពុងបង្កើត..." : "យល់ព្រមបង្កើត"}
                            </button>
                          </div>
                        </form>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Active Wedding Selection Bar */}
                  <div className="bg-white border border-pink-100 rounded-3xl p-6 shadow-sm space-y-4">
                    <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                      <div className="w-full md:w-80">
                        <label className="block text-xs font-bold text-slate-500 mb-1.5">ជ្រើសរើសពិធីមង្គលការដើម្បីរៀបចំ៖</label>
                        <select
                          id="admin-wedding-select"
                          value={selectedWeddingId}
                          onChange={(e) => setSelectedWeddingId(e.target.value)}
                          className="w-full text-sm font-bold text-slate-800 px-3 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:border-pink-300"
                        >
                          {weddings.map((w) => (
                            <option key={w.id} value={w.id}>
                              {w.title}
                            </option>
                          ))}
                        </select>
                      </div>

                      <button
                        onClick={() => setShowManualAddForm(!showManualAddForm)}
                        className="w-full md:w-auto flex items-center justify-center gap-1.5 bg-slate-900 text-white text-xs font-bold px-4 py-3 rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
                      >
                        <Plus className="w-4.5 h-4.5" />
                        គណៈកម្មការ បន្ថែមឈ្មោះភ្ញៀវផ្ទាល់
                      </button>
                    </div>

                    {/* Expandable Manual Add Guest Form */}
                    <AnimatePresence>
                      {showManualAddForm && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="border-t border-slate-100 pt-4 overflow-hidden"
                        >
                          <form onSubmit={handleManualAddGuest} className="grid grid-cols-1 md:grid-cols-4 gap-3">
                            <div>
                              <label className="block text-[10px] font-bold text-slate-600">ឈ្មោះភ្ញៀវ *</label>
                              <input
                                type="text"
                                required
                                value={manualName}
                                onChange={(e) => setManualName(e.target.value)}
                                placeholder="ឈ្មោះពេញ"
                                className="w-full text-xs px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-slate-600">លេខទូរស័ព្ទ *</label>
                              <input
                                type="text"
                                required
                                value={manualPhone}
                                onChange={(e) => setManualPhone(e.target.value)}
                                placeholder="លេខទំនាក់ទំនង"
                                className="w-full text-xs px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-slate-600">ចំនួនអ្នកមកជាមួយ</label>
                              <input
                                type="number"
                                min="0"
                                value={manualCompanions}
                                onChange={(e) => setManualCompanions(Math.max(0, Number(e.target.value)))}
                                className="w-full text-xs px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-slate-600">ទំនាក់ទំនង</label>
                              <select
                                value={manualRelation}
                                onChange={(e) => setManualRelation(e.target.value)}
                                className="w-full text-xs px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
                              >
                                <option value="ខាងកូនកំលោះ">ខាងកូនកំលោះ</option>
                                <option value="ខាងកូនក្រមុំ">ខាងកូនក្រមុំ</option>
                                <option value="មិត្តភក្តិ">មិត្តភក្តិ</option>
                                <option value="ផ្សេងៗ">ផ្សេងៗ</option>
                              </select>
                            </div>
                            <div className="md:col-span-2">
                              <label className="block text-[10px] font-bold text-slate-600">ទឹកប្រាក់ចងដៃ (USD $)</label>
                              <input
                                type="number"
                                min="0"
                                value={manualAmount}
                                onChange={(e) => setManualAmount(e.target.value)}
                                placeholder="ឧ. 50"
                                className="w-full text-xs px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
                              />
                            </div>
                            <div className="md:col-span-2">
                              <label className="block text-[10px] font-bold text-slate-600">កំណត់សម្គាល់ (Note)</label>
                              <input
                                type="text"
                                value={manualNote}
                                onChange={(e) => setManualNote(e.target.value)}
                                placeholder="ជូនពរ..."
                                className="w-full text-xs px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
                              />
                            </div>
                            <div className="md:col-span-4 flex justify-end gap-1.5 pt-1">
                              <button
                                type="button"
                                onClick={() => setShowManualAddForm(false)}
                                className="text-[10px] font-bold px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-all cursor-pointer"
                              >
                                បោះបង់
                              </button>
                              <button
                                type="submit"
                                disabled={addingManualGuest}
                                className="text-[10px] bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3.5 py-1 rounded-lg transition-all cursor-pointer"
                              >
                                {addingManualGuest ? "កំពុងបន្ថែម..." : "យល់ព្រមបន្ថែម"}
                              </button>
                            </div>
                          </form>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Integrated Guest Table UI of Selected Wedding with filter & search */}
                  <div className="bg-white border border-pink-100 rounded-3xl overflow-hidden shadow-sm flex flex-col">
                    
                    {/* Filter and Search Panel */}
                    <div className="p-6 border-b border-pink-55/80 flex flex-col md:flex-row gap-3 items-center justify-between">
                      <div className="relative w-full md:w-72">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                        <input
                          type="text"
                          value={adminSearchQuery}
                          onChange={(e) => setAdminSearchQuery(e.target.value)}
                          placeholder="ស្វែងរកតាមឈ្មោះ ឬ លេខទូរស័ព្ទ..."
                          className="w-full text-xs pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 focus:outline-hidden focus:border-pink-300"
                        />
                      </div>

                      {/* Filter badging row */}
                      <div className="flex bg-slate-100 p-0.5 rounded-xl border border-slate-200/50 text-[10px] font-bold shadow-inner">
                        <button
                          onClick={() => setAdminStatusFilter("all")}
                          className={`px-3 py-1.5 rounded-lg cursor-pointer ${
                            adminStatusFilter === "all" ? "bg-white text-pink-600 shadow-xs border border-pink-100/10" : "text-slate-500 hover:text-slate-900"
                          }`}
                        >
                          ទាំងអស់ ({guests.filter(g => g.wedding_id === selectedWeddingId).length})
                        </button>
                        <button
                          onClick={() => setAdminStatusFilter("pending")}
                          className={`px-3 py-1.5 rounded-lg cursor-pointer ${
                            adminStatusFilter === "pending" ? "bg-white text-pink-600 shadow-xs border border-pink-100/10" : "text-slate-500 hover:text-slate-900"
                          }`}
                        >
                          រង់ចាំ ({guests.filter(g => g.wedding_id === selectedWeddingId && g.status === "pending").length})
                        </button>
                        <button
                          onClick={() => setAdminStatusFilter("approved")}
                          className={`px-3 py-1.5 rounded-lg cursor-pointer ${
                            adminStatusFilter === "approved" ? "bg-white text-pink-600 shadow-xs border border-pink-100/10" : "text-slate-500 hover:text-slate-900"
                          }`}
                        >
                          អនុម័តរួច ({guests.filter(g => g.wedding_id === selectedWeddingId && g.status === "approved").length})
                        </button>
                      </div>
                    </div>

                    {/* Table View */}
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-100/50 border-b border-slate-150 text-[11px] font-bold text-slate-600 tracking-wider">
                            <th className="py-3 px-4 text-center">ល.រ</th>
                            <th className="py-3 px-4">ឈ្មោះភ្ញៀវកិត្តិយស</th>
                            <th className="py-3 px-4">លេខទូរស័ព្ទ</th>
                            <th className="py-3 px-4 text-center">អ្នកមកជាមួយ</th>
                            <th className="py-3 px-4">ប្រភេទទំនាក់ទំនង</th>
                            <th className="py-3 px-4 text-right">ទឹកប្រាក់ចងដៃ</th>
                            <th className="py-3 px-4">ពាក្យជូនពរ/កំណត់សម្គាល់</th>
                            <th className="py-3 px-4 text-center">ស្ថានភាព</th>
                            <th className="py-3 px-4 text-center">សកម្មភាព</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                          {adminFilteredGuests.length === 0 ? (
                            <tr>
                              <td colSpan={9} className="py-8 text-center text-slate-400 font-medium">
                                គ្មានទិន្នន័យភ្ញៀវចុះឈ្មោះត្រូវនឹងការស្វែងរកឡើយ។
                              </td>
                            </tr>
                          ) : (
                            adminFilteredGuests.map((g, index) => (
                              <tr key={g.id} className="hover:bg-slate-50/50 transition-colors">
                                <td className="py-3.5 px-4 text-center font-semibold text-slate-400">{index + 1}</td>
                                <td className="py-3.5 px-4 font-bold text-slate-800">{g.name}</td>
                                <td className="py-3.5 px-4 font-medium text-slate-600 font-mono">{g.phone}</td>
                                <td className="py-3.5 px-4 text-center font-bold text-slate-800">{g.companions} នាក់</td>
                                <td className="py-3.5 px-4">
                                  <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-semibold text-[10px]">
                                    {g.relation_type}
                                  </span>
                                </td>
                                <td className="py-3.5 px-4 text-right font-bold text-emerald-600 font-mono">${g.amount}</td>
                                <td className="py-3.5 px-4 max-w-xs truncate text-[11px] text-slate-500 italic" title={g.note}>
                                  {g.note || "-"}
                                </td>
                                <td className="py-3.5 px-4 text-center">
                                  <span
                                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                      g.status === "approved"
                                        ? "bg-emerald-50 text-emerald-700"
                                        : "bg-amber-50 text-amber-700 animate-pulse"
                                    }`}
                                  >
                                    {g.status === "approved" ? "យល់ព្រម" : "រង់ចាំត្រួតពិនិត្យ"}
                                  </span>
                                </td>
                                <td className="py-3.5 px-4 text-center whitespace-nowrap">
                                  <div className="inline-flex gap-1.5 h-7">
                                    {g.status === "pending" && (
                                      <button
                                        onClick={() => handleApproveGuest(g.id)}
                                        title="បញ្ជាក់ការអនុម័ត"
                                        className="h-full bg-emerald-50 border border-emerald-200 text-emerald-700 px-2 py-1 rounded-lg hover:bg-emerald-100 text-[10px] font-bold cursor-pointer transition-all flex items-center justify-center gap-1"
                                      >
                                        <Check className="w-3.5 h-3.5" />
                                        អនុម័ត
                                      </button>
                                    )}
                                    <button
                                      onClick={() => handleDeleteGuest(g.id)}
                                      title="លុបទិន្នន័យ"
                                      className="h-full bg-rose-50 border border-rose-250 text-rose-700 px-2.5 py-1 rounded-lg hover:bg-rose-100 text-[10px] font-bold cursor-pointer transition-all flex items-center justify-center"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>

                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* ==========================================
              TAB 3: HOST VIEW (GUEST DASHBOARD & STATISTICS)
              ========================================== */}
          {activeTab === "host" && (
            <motion.div
              key="host-tab"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-6"
            >
              {/* Check Host Login State */}
              {!currentHostWedding ? (
                <div className="max-w-md mx-auto bg-white border border-pink-100 rounded-3xl p-8 shadow-sm space-y-6">
                  <div className="text-center space-y-2">
                    <div className="inline-block p-3.5 bg-pink-50 text-pink-600 rounded-full shadow-sm shadow-pink-100/50">
                      <Users className="w-7 h-7" />
                    </div>
                    <h2 className="text-xl font-bold text-slate-900 font-serif">គណនីម្ចាស់ពិធី (Bride & Groom Login)</h2>
                    <p className="text-xs text-slate-400 font-medium">
                      សូមបញ្ចូលគណនី និងលេខសម្ងាត់របស់ម្ចាស់ពិធីជាក់លាក់ដើម្បីមើលរបាយការណ៍សង្ខេប
                    </p>
                  </div>

                  <form onSubmit={handleHostLogin} className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">ឈ្មោះគណនីម្ចាស់ពិធី (Host Username)</label>
                      <input
                        type="text"
                        required
                        value={hostUsername}
                        onChange={(e) => setHostUsername(e.target.value)}
                        placeholder="ឧ. wedding123"
                        className="w-full text-sm px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:border-pink-300 transition-all text-slate-800 font-medium"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">លេខសម្ងាត់របស់ម្ចាស់ពិធី (Host Password)</label>
                      <input
                        type="password"
                        required
                        value={hostPassword}
                        onChange={(e) => setHostPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full text-sm px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:border-pink-300 transition-all text-slate-800 font-semibold"
                      />
                    </div>
                    
                    <button
                      type="submit"
                      className="w-full bg-pink-600 hover:bg-pink-700 text-white font-bold py-3 px-4 rounded-xl shadow-md transition-all cursor-pointer text-xs"
                    >
                      ចូលមើលរបាយការណ៍ និងស្ថិតិ
                    </button>
                  </form>

                  <div className="bg-pink-50/50 border border-pink-100/60 rounded-2xl p-4 flex items-start gap-2">
                    <Info className="w-4 h-4 text-pink-700 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-[10px] text-pink-850 font-bold">គណនីគំរូម្ចាស់ពិធីសាកល្បង៖</p>
                      <p className="text-[10px] text-pink-750 font-medium font-mono">Username: <strong className="font-bold">wedding123</strong> &nbsp;|&nbsp; Password: <strong className="font-bold">host123</strong></p>
                    </div>
                  </div>
                </div>
              ) : (
                /* Host Statistics and Grid Layout Screen (Read-Only) */
                <div className="space-y-6">
                  
                  {/* Host Logged In Banner */}
                  <div className="bg-white border border-pink-100 rounded-3xl p-6 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-pink-50 text-pink-600 rounded-2xl">
                        <Heart className="w-5 h-5 fill-pink-500 text-pink-500 text-none" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-900 font-serif">សួស្តីសាមីខ្លួនម្ចាស់ពិធីអាពាហ៍ពិពាហ៍! 💖</h3>
                        <p className="text-xs text-pink-700 font-bold font-serif">{currentHostWedding.title}</p>
                      </div>
                    </div>

                    <button
                      onClick={() => setCurrentHostWedding(null)}
                      className="flex items-center gap-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs"
                    >
                      <LogOut className="w-4 h-4 text-slate-400" />
                      ចាកចេញពីរបាយការណ៍
                    </button>
                  </div>

                  {/* 3 Styled Statistical Cards Requested */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    
                    {/* Card 1: Total Registered Guests */}
                    <div className="bg-white border border-pink-100 rounded-3xl p-6 shadow-sm flex flex-col justify-between h-32">
                      <p className="text-slate-500 text-xs font-bold mb-1 uppercase tracking-wider">សរុបភ្ញៀវចុះឈ្មោះ</p>
                      <div className="flex items-end justify-between">
                        <h3 className="text-3xl font-black text-slate-900">{totalRegisteredGuests} <span className="text-sm font-normal text-slate-400">នាក់</span></h3>
                        <div className="text-green-500 bg-green-50 px-2.5 py-1 rounded-full text-[10px] font-bold">+១២ ថ្ងៃនេះ</div>
                      </div>
                    </div>

                    {/* Card 2: Actual Total Attendees (Approved + companions of approved) */}
                    <div className="bg-white border border-pink-100 rounded-3xl p-6 shadow-sm flex flex-col justify-between h-32">
                      <p className="text-slate-500 text-xs font-bold mb-1 uppercase tracking-wider">អ្នកចូលរួមជាក់ស្តែង</p>
                      <div className="flex items-end justify-between">
                        <h3 className="text-3xl font-black text-slate-900">{actualTotalAttendees} <span className="text-sm font-normal text-slate-400">នាក់</span></h3>
                        <div className="text-pink-500 bg-pink-50 px-2.5 py-1 rounded-full text-[10px] font-bold">រួមទាំងកូនក្មេង</div>
                      </div>
                    </div>

                    {/* Card 3: Total Gift Money USD */}
                    <div className="bg-white border border-pink-100 rounded-3xl p-6 shadow-sm flex flex-col justify-between h-32">
                      <p className="text-slate-500 text-xs font-bold mb-1 uppercase tracking-wider">ចំនួនប្រាក់ចងដៃសរុប</p>
                      <div className="flex items-end justify-between">
                        <h3 className="text-3xl font-black text-pink-600">${totalGiftAmount.toLocaleString()}</h3>
                        <div className="text-slate-405 text-[10px] font-medium">មធ្យម ${(totalRegisteredGuests > 0 ? (totalGiftAmount / totalRegisteredGuests).toFixed(1) : "0")}/ម្នាក់</div>
                      </div>
                    </div>

                  </div>

                  {/* Read Only Table of Guest List with excel export */}
                  <div className="bg-white border border-pink-100 rounded-3xl overflow-hidden shadow-sm flex flex-col">
                    
                    {/* Toolbar */}
                    <div className="p-6 border-b border-pink-50 flex flex-col md:flex-row gap-4 items-center justify-between">
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-slate-900">បញ្ជីភ្ញៀវថ្មីៗ</h4>
                      </div>

                      <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto">
                        <div className="relative w-full md:w-60">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300 w-4 h-4" />
                          <input
                            type="text"
                            value={hostSearchQuery}
                            onChange={(e) => setHostSearchQuery(e.target.value)}
                            placeholder="ស្វែងរកឈ្មោះ..."
                            className="w-full text-xs pl-9 pr-4 py-2 border border-slate-200 rounded-xl outline-none focus:border-pink-300"
                          />
                        </div>

                        {/* Export to Excel sheetjs */}
                        <button
                          onClick={() => exportToExcel(hostFilteredGuests, currentHostWedding.title)}
                          className="flex items-center justify-center gap-1.5 bg-pink-600 hover:bg-pink-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all cursor-pointer shadow-md shadow-pink-200 hover:shadow-lg"
                        >
                          <FileSpreadsheet className="w-4 h-4" />
                          ទាញយកឯកសារ Excel (.xlsx)
                        </button>
                      </div>
                    </div>

                    {/* Guest Table (ReadOnly) */}
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-100/30 border-b border-slate-150 text-[11px] font-bold text-slate-600 tracking-wider">
                            <th className="py-3 px-4 text-center">ល.រ</th>
                            <th className="py-3 px-4">ឈ្មោះភ្ញៀវកិត្តិយស</th>
                            <th className="py-3 px-4">លេខទូរស័ព្ទ</th>
                            <th className="py-3 px-4 text-center">អ្នកមកជាមួយ</th>
                            <th className="py-3 px-4">ប្រភេទទំនាក់ទំនង</th>
                            <th className="py-3 px-4 text-right">ទឹកប្រាក់ចងដៃ</th>
                            <th className="py-3 px-4">ពាក្យជូនពរ/កំណត់សម្គាល់</th>
                            <th className="py-3 px-4 text-center">ស្ថានភាព</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                          {hostFilteredGuests.length === 0 ? (
                            <tr>
                              <td colSpan={8} className="py-8 text-center text-slate-400 font-medium">
                                មិនទាន់មានភ្ញៀវចុះឈ្មោះក្នុងកម្មវិធីនេះឡើយ។
                              </td>
                            </tr>
                          ) : (
                            hostFilteredGuests.map((g, index) => (
                              <tr key={g.id} className="hover:bg-slate-50/30 transition-colors">
                                <td className="py-3 px-4 text-center font-semibold text-slate-400">{index + 1}</td>
                                <td className="py-3 px-4 font-bold text-slate-800">{g.name}</td>
                                <td className="py-3 px-4 font-medium text-slate-600 font-mono">{g.phone}</td>
                                <td className="py-3 px-4 text-center font-bold text-slate-800">{g.companions} នាក់</td>
                                <td className="py-3 px-4">
                                  <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-semibold text-[10px]">
                                    {g.relation_type}
                                  </span>
                                </td>
                                <td className="py-3 px-4 text-right font-bold text-slate-800 font-mono">${g.amount}</td>
                                <td className="py-3 px-4 max-w-sm truncate text-[11px] text-slate-550 italic" title={g.note}>
                                  {g.note || "-"}
                                </td>
                                <td className="py-3 px-4 text-center">
                                  <span
                                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                      g.status === "approved"
                                        ? "bg-emerald-50 text-emerald-700"
                                        : "bg-amber-50 text-amber-700 animate-pulse"
                                    }`}
                                  >
                                    {g.status === "approved" ? "យល់ព្រម" : "រង់ចាំពិនិត្យ"}
                                  </span>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>

                  </div>

                </div>
              )}
            </motion.div>
          )}

        </AnimatePresence>

      </main>

      {/* ==========================================
          Success Dialog (Registration Done overlay)
          ========================================== */}
      <AnimatePresence>
        {showRsvpSuccess && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white border border-pink-100 rounded-3xl p-8 max-w-md w-full shadow-2xl text-center space-y-5"
            >
              <div className="w-14 h-14 bg-pink-50 text-pink-500 rounded-full flex items-center justify-center mx-auto shadow-md shadow-pink-100">
                <CheckCircle2 className="w-8 h-8 text-pink-500 fill-pink-50/50" />
              </div>
              
              <h3 className="text-xl font-bold font-serif text-slate-900">ការចុះឈ្មោះទទួលបានជោគជ័យ! 🎉</h3>
              <p className="text-xs text-slate-500 leading-relaxed font-sans font-medium">
                សូមអរគុណបងប្អូនកិត្តិយសសម្រាប់ការបំពេញព័ត៌មាន និងជូនពរជ័យដល់គូស្វាមីភរិយាថ្មី។ គណៈកម្មការរៀបចំពិធីមង្គលការនឹងត្រួតពិនិត្យ ផ្ទៀងផ្ទាត់ និងអនុម័តព័ត៌មានរបស់លោកអ្នកបន្តិចទៀតនេះ។
              </p>

              {/* Detail receipt in Khmer */}
              <div className="bg-pink-50/30 border border-pink-100 rounded-2xl p-4 text-left divide-y divide-pink-100 text-xs text-slate-700">
                <div className="py-2.5 flex justify-between font-bold">
                  <span>កម្មវិធី៖</span>
                  <span className="text-pink-600 text-right max-w-44 truncate">{activeWedding?.title}</span>
                </div>
                {lastSubmittedId && guests.find(g => g.id === lastSubmittedId) && (
                  <>
                    <div className="py-2.5 flex justify-between">
                      <span>ឈ្មោះ៖</span>
                      <strong className="text-slate-900">{guests.find(g => g.id === lastSubmittedId)?.name}</strong>
                    </div>
                    <div className="py-2.5 flex justify-between">
                      <span>លេខទូរស័ព្ទ៖</span>
                      <strong className="text-slate-900 font-mono">{guests.find(g => g.id === lastSubmittedId)?.phone}</strong>
                    </div>
                    {guests.find(g => g.id === lastSubmittedId)!.companions > 0 && (
                      <div className="py-2.5 flex justify-between">
                        <span>មកជាមួយ៖</span>
                        <strong className="text-slate-900">{guests.find(g => g.id === lastSubmittedId)!.companions} នាក់</strong>
                      </div>
                    )}
                    {guests.find(g => g.id === lastSubmittedId)!.amount > 0 && (
                      <div className="py-2.5 flex justify-between">
                        <span>ប្រាក់ចងដៃ៖</span>
                        <strong className="text-pink-650 font-bold font-mono">${guests.find(g => g.id === lastSubmittedId)!.amount} USD</strong>
                      </div>
                    )}
                  </>
                )}
                <div className="py-2.5 flex justify-between">
                  <span>ស្ថានភាព៖</span>
                  <span className="font-bold text-amber-600">រង់ចាំការបញ្ជាក់</span>
                </div>
              </div>

              <button
                id="close-success-dialog"
                onClick={() => setShowRsvpSuccess(false)}
                className="w-full bg-pink-600 hover:bg-pink-700 text-white font-bold py-3 rounded-xl shadow-md shadow-pink-200/50 transition-colors cursor-pointer text-xs"
              >
                យល់ព្រមបិទ
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer System Credits in page layout */}
      <footer className="bg-white text-slate-500 border-t border-pink-100 py-6 text-[11px] text-center space-y-1 mt-auto">
        <p className="font-medium text-slate-650 font-serif">© 2026 គ្រប់គ្រងសិទ្ធិដោយម្ចាស់ពិធីអាពាហ៍ពិពាហ៍</p>
        <p className="font-mono text-slate-400">Server Time: {DEFAULT_REAL_TIME} | Sandbox Active</p>
      </footer>

      <QrInvitationScanner
        isOpen={isQrScannerOpen}
        onClose={() => setIsQrScannerOpen(false)}
        onScanSuccess={handleQrScanSuccess}
      />

    </div>
  );
}
