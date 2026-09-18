import { NextResponse } from "next/server";
import { generateStudyAIContent } from "@/lib/ai/gemini";

export const runtime="nodejs"; export const dynamic="force-dynamic";

const SYSTEM=`You are the action planner for Lakshya AI. Never mention any underlying AI provider/model.
Your job is to convert a student's natural-language request into ONE safe, structured app action.
Return ONLY JSON:
{
 "status":"ready"|"needs_info"|"chat",
 "action":null|{"type":string,"requiresConfirmation":boolean,"payload":object},
 "questions":string[],
 "summary":string
}
Allowed action types:
CREATE_PLAN: payload {planTitle,summary,tasks:[{title,subjectId,date,time,durationMinutes}]}
SAVE_QUIZ: payload {title,subject,chapter,language,difficulty,durationMinutes,questions:[{question,options:[4 strings],answer:number,explanation?:string}]}
SAVE_NOTE: payload {title,content,subject?:string}
LOG_STUDY_SESSION: payload {subjectId,minutes,date?}
UPDATE_PROGRESS: payload {chapterId,progress}
UPDATE_SETTINGS: payload {privacy?,notifications?,appearance?,language?}
NAVIGATE: payload {path}
Rules:
- Ask for missing information that is essential. Do not invent dates, durations, chapters, quiz contents, note contents, or progress.
- Any data-changing action requires requiresConfirmation=true.
- NAVIGATE is safe and can be false.
- Never expose or request passwords, API keys, or secrets.
- Never delete data in this version.
- If the user merely asks a normal study question, return status=chat and action=null.`;

function parse(text:string){const s=text.trim().replace(/^\`\`\`(?:json)?\s*/i,"").replace(/\s*\`\`\`$/i,"");const a=s.indexOf("{"),b=s.lastIndexOf("}");if(a<0||b<=a)throw new Error("Invalid action");return JSON.parse(s.slice(a,b+1));}

export async function POST(req:Request){
 try{
  const body=await req.json(); const message=typeof body?.message==="string"?body.message.trim():"";
  const context=typeof body?.context==="string"?body.context:"";
  if(!message)return NextResponse.json({error:"Request is required"},{status:400});
  const raw=await generateStudyAIContent(`Student context:\n${context||"None"}\n\nRequest:\n${message}\n\nIdentify whether this is an allowed Lakshya app action. Return the JSON schema exactly.`,SYSTEM);
  const data=parse(raw);
  if(!["ready","needs_info","chat"].includes(data.status))data.status="chat";
  if(!Array.isArray(data.questions))data.questions=[];
  if(data.action && typeof data.action==="object"){
   data.action.requiresConfirmation=data.action.type==="NAVIGATE"?false:true;
  }
  return NextResponse.json(data);
 }catch(error){console.error("Lakshya action planner error",error);return NextResponse.json({error:"I could not process that app action right now. Please try again."},{status:503});}
}