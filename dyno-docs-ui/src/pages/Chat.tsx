import { useLocation } from "react-router-dom";
import { getChatbotCommands } from "../services/chatbot-api";
import { useEffect } from "react";

export default function Chat() {
    const location = useLocation();

    const handleGetCommands = async () => {
        const token = sessionStorage.getItem("dd_token") || "";
        const botId = location.pathname.split("/").pop();

        try {
            const res = await getChatbotCommands(botId || "", token);
        } catch (error) {
            
        }
    }

    useEffect(() => {
        handleGetCommands();
    }, [location.pathname]);

    return (
        <div className="chatPage">
            {/* {location.pathname.split("/").pop()} */}
        </div>
    )
}