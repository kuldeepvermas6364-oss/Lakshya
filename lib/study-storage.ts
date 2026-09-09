import { collection, addDoc, doc, setDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase";

export async function saveStudySession(uid:string,subjectId:string,minutes:number){if(!uid||minutes<=0)throw new Error("Invalid study session");return addDoc(collection(db,"users",uid,"studySessions"),{subjectId,minutes,createdAt:serverTimestamp()})}
export async function savePracticeAttempt(uid:string,data:{subject:string;chapter:string;correct:boolean}){if(!uid)throw new Error("Sign in required");return addDoc(collection(db,"users",uid,"practiceAttempts"),{...data,createdAt:serverTimestamp()})}
export async function savePlannerTask(uid:string,task:{title:string;subjectId?:string;date:string;durationMinutes:number;completed?:boolean}){if(!uid||!task.title.trim())throw new Error("Invalid planner task");return addDoc(collection(db,"users",uid,"plannerTasks"),{...task,completed:Boolean(task.completed),createdAt:serverTimestamp()})}
export async function updateChapterProgress(uid:string,chapterId:string,progress:number){const safe=Math.max(0,Math.min(100,Math.round(progress)));return setDoc(doc(db,"users",uid,"chapterProgress",chapterId),{progress:safe,updatedAt:serverTimestamp()},{merge:true})}
export async function updateStudyProfile(uid:string,data:Record<string,unknown>){return updateDoc(doc(db,"users",uid),{...data,updatedAt:serverTimestamp()})}
