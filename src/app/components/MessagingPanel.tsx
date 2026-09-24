import { MoreHorizontal, Paperclip, Phone, Send, Smile, Video, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import {
  addNotification,
  appendStudentMessage,
  createAutomatedStudentReply,
  createMessageTimestamp,
  getStudentMessages,
  saveStudentMessages,
} from "../data/academyStore";

type Message = {
  id: number;
  from: "admin" | "student";
  text: string;
  time: string;
  read: boolean;
};

const INITIAL_MESSAGES: Record<string, Message[]> = {
  "benjamin-leclerc": [
    { id: 1, from: "admin", text: "Bonjour Benjamin, j'ai regardé vos dernières soumissions. Le principal blocage est la limite d'activités.", time: "28 Mars, 09:12", read: true },
    { id: 2, from: "student", text: "Oui, je dois encore mieux découper le workflow principal.", time: "28 Mars, 10:45", read: true },
  ],
  "camille-durand": [
    { id: 1, from: "admin", text: "Le template REFramework reste le meilleur point de départ pour ce projet.", time: "02 Avril, 10:00", read: true },
  ],
  "alice-martin": [
    { id: 1, from: "admin", text: "Excellent travail sur le Projet 1 Alice.", time: "10 Avril, 15:00", read: true },
  ],
};

const DEFAULT_MESSAGES: Message[] = [
  { id: 1, from: "admin", text: "Bonjour, n'hésitez pas à me contacter si vous avez des questions sur votre parcours.", time: "01 Avril, 09:00", read: true },
];

type Props = {
  studentId: string;
  studentName: string;
  studentAvatar: string;
  tutorName: string;
  onClose: () => void;
};

export function MessagingPanel({ studentId, studentName, studentAvatar, tutorName, onClose }: Props) {
  const [messages, setMessages] = useState<Message[]>(
    getStudentMessages(studentId, INITIAL_MESSAGES[studentId] ?? DEFAULT_MESSAGES),
  );
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [actionNote, setActionNote] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    saveStudentMessages(studentId, messages);
  }, [messages, studentId]);

  const send = () => {
    const trimmed = input.trim();
    if (!trimmed) return;

    setSending(true);
    setInput("");

    setTimeout(() => {
      const adminMessage: Message = {
        id: Date.now(),
        from: "admin",
        text: trimmed,
        time: createMessageTimestamp(),
        read: true,
      };

      appendStudentMessage(studentId, adminMessage);
      setMessages((prev) => [...prev, adminMessage]);
      setSending(false);

      addNotification({
        kind: "info",
        title: `Message envoyé à ${studentName}`,
        message: "La conversation a été enregistrée dans le suivi local.",
        href: `/admin/apprenant/${studentId}`,
      });

      setTimeout(() => {
        const reply: Message = {
          id: Date.now() + 1,
          from: "student",
          text: createAutomatedStudentReply(),
          time: createMessageTimestamp(),
          read: true,
        };
        appendStudentMessage(studentId, reply);
        setMessages((prev) => [...prev, reply]);
      }, 1800);
    }, 350);
  };

  const triggerAction = (message: string) => setActionNote(message);

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end"
      style={{ backgroundColor: "rgba(0,0,0,0.4)", backdropFilter: "blur(3px)" }}
      onClick={(event) => event.target === event.currentTarget && onClose()}
    >
      <div
        className="flex flex-col w-full max-w-md h-full"
        style={{ backgroundColor: "#fff", boxShadow: "-8px 0 40px rgba(0,0,0,0.18)" }}
      >
        <div
          className="flex items-center gap-3 px-5 py-4"
          style={{ background: "linear-gradient(135deg, #0A1628, #0F2954)", borderBottom: "1px solid #1E3A5F" }}
        >
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center text-sm text-white shrink-0"
            style={{ background: "linear-gradient(135deg, #005EFA, #3B82F6)", fontWeight: 800 }}
          >
            {studentAvatar}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm" style={{ color: "#F1F5F9", fontWeight: 700 }}>{studentName}</p>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: "#22C55E" }} />
              <p className="text-xs" style={{ color: "#64748B" }}>En ligne · Tuteur : {tutorName}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => triggerAction(`Appel vocal simulé avec ${studentName}.`)} className="w-8 h-8 rounded-lg flex items-center justify-center hover:opacity-70 transition-opacity">
              <Phone size={14} color="#64748B" />
            </button>
            <button onClick={() => triggerAction(`Lien de visio préparé pour ${studentName}.`)} className="w-8 h-8 rounded-lg flex items-center justify-center hover:opacity-70 transition-opacity">
              <Video size={14} color="#64748B" />
            </button>
            <button onClick={() => triggerAction(`Conversation archivée avec ${tutorName} comme tuteur référent.`)} className="w-8 h-8 rounded-lg flex items-center justify-center hover:opacity-70 transition-opacity">
              <MoreHorizontal size={14} color="#64748B" />
            </button>
            <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center hover:opacity-70 transition-opacity">
              <X size={16} color="#94A3B8" />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 px-5 py-2.5 text-xs" style={{ backgroundColor: "#EFF6FF", borderBottom: "1px solid #BFDBFE" }}>
          <span style={{ color: "#1D4ED8", fontWeight: 600 }}>Messagerie Admin → Apprenant</span>
          <span style={{ color: "#60A5FA" }}>· Historique conservé localement</span>
        </div>

        {actionNote && (
          <div className="px-5 py-2 text-xs" style={{ backgroundColor: "#F0FDF4", color: "#15803D", borderBottom: "1px solid #BBF7D0", fontWeight: 600 }}>
            {actionNote}
          </div>
        )}

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3" style={{ backgroundColor: "#F8FAFC" }}>
          {messages.map((message) => {
            const isAdmin = message.from === "admin";
            return (
              <div key={message.id} className={`flex gap-2 ${isAdmin ? "flex-row-reverse" : "flex-row"}`}>
                {!isAdmin && (
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center text-xs text-white shrink-0 mt-0.5"
                    style={{ background: "linear-gradient(135deg,#005EFA,#3B82F6)", fontWeight: 700, fontSize: "0.6rem" }}
                  >
                    {studentAvatar}
                  </div>
                )}
                <div className={`max-w-[78%] flex flex-col gap-1 ${isAdmin ? "items-end" : "items-start"}`}>
                  <div
                    className="px-3.5 py-2.5 rounded-2xl text-sm"
                    style={{
                      backgroundColor: isAdmin ? "#005EFA" : "#fff",
                      color: isAdmin ? "#fff" : "#1F2937",
                      borderRadius: isAdmin ? "18px 6px 18px 18px" : "6px 18px 18px 18px",
                      boxShadow: "0 1px 4px rgba(0,0,0,0.07)",
                      lineHeight: 1.5,
                    }}
                  >
                    {message.text}
                  </div>
                  <span className="text-xs px-1" style={{ color: "#9CA3AF" }}>{message.time}</span>
                </div>
              </div>
            );
          })}

          {sending && (
            <div className="flex flex-row-reverse gap-2">
              <div className="px-4 py-2.5 rounded-2xl text-sm" style={{ backgroundColor: "#E0EAFF", color: "#374151" }}>
                Envoi en cours…
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        <div className="px-5 py-2 flex gap-2 overflow-x-auto" style={{ borderTop: "1px solid #F3F4F6" }}>
          {[
            "Regardez le template REFramework",
            "Bonne soumission",
            "Utilisez un Orchestrator Asset",
            "Session de mentorat disponible",
          ].map((text) => (
            <button
              key={text}
              onClick={() => setInput(text)}
              className="shrink-0 px-3 py-1.5 rounded-full text-xs whitespace-nowrap hover:opacity-80 transition-opacity"
              style={{ backgroundColor: "#EFF6FF", color: "#005EFA", fontWeight: 600, border: "1px solid #BFDBFE" }}
            >
              {text}
            </button>
          ))}
        </div>

        <div className="flex items-end gap-2 px-4 py-3" style={{ borderTop: "1px solid #E5E7EB", backgroundColor: "#fff" }}>
          <button onClick={() => triggerAction("Ajout de pièce jointe simulé.")} className="p-2 hover:opacity-70">
            <Paperclip size={16} color="#9CA3AF" />
          </button>
          <div className="flex-1 relative">
            <textarea
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  send();
                }
              }}
              placeholder="Écrire un message…"
              rows={1}
              className="w-full px-4 py-2.5 rounded-2xl text-sm outline-none resize-none"
              style={{ border: "1.5px solid #E5E7EB", backgroundColor: "#F9FAFB", color: "#111827", maxHeight: 100 }}
            />
          </div>
          <button onClick={() => triggerAction("Palette d’émojis simulée.")} className="p-2 hover:opacity-70">
            <Smile size={16} color="#9CA3AF" />
          </button>
          <button
            onClick={send}
            disabled={!input.trim() || sending}
            className="w-10 h-10 rounded-full flex items-center justify-center transition-all hover:opacity-90"
            style={{ backgroundColor: input.trim() ? "#005EFA" : "#E5E7EB", boxShadow: input.trim() ? "0 4px 12px rgba(0,94,250,0.3)" : "none" }}
          >
            <Send size={15} color={input.trim() ? "#fff" : "#9CA3AF"} />
          </button>
        </div>
      </div>
    </div>
  );
}
