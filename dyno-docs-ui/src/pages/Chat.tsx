import { useLocation } from "react-router-dom";
import { getChatbotCommands, getChatbotName } from "../services/chatbot-api";
import { useEffect } from "react";

export default function Chat() {
    const location = useLocation();

    const handleGetCommands = async () => {
        const botId = location.pathname.split("/").pop();

        try {
            const res = await getChatbotCommands(botId || "", "");
        } catch (error) {
            
        }
    }

    const handleGetBotName = async () => {
        const botId = location.pathname.split("/").pop();
        
        try {
            const res = await getChatbotName(botId || "", "");
        } catch (error) {
            
        }
    }

    useEffect(() => {
        handleGetCommands();
        handleGetBotName();
    }, [location.pathname]);

    return (
        <div className="chatPage">
            {/* {location.pathname.split("/").pop()} */}
        </div>
    )
}