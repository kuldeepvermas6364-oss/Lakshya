"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import LakshyaAI from "./components/lakshya-ai";
import { useAuth } from "../lib/auth-context";
import { LakshyaIcon } from "./components/lakshya-icon";

const primary = [["home","Dashboard","/"],["book","Study","/study"],["practice","Practice","/practice"],["timer","Focus Mode","/focus"],["note","Notes","/notes"],["chart","Analytics","/analytics"]];
const social = [["users","Community","/community"],["user-plus","Friends","/friends"],["message","Messages","/messages"],["groups","Study Groups","/groups"]];
const extra = [["target","Goals","/goals"],["refresh","Revision","/revision"],["trophy","Achievements","/achievements"],["bell","Notifications","/notifications"],["briefcase","Career","/career"]];function PremiumNavIcon({type}:{type:"home"|"study"|"practice"|"ai"|"community"|"career"}) {
 const map={home:"home",study:"book",practice:"practice",ai:"sparkles",community:"users",career:"briefcase"} as const;
 return <LakshyaIcon name={map[type]} size={22} />;
}
