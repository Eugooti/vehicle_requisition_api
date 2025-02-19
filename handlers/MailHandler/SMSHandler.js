require('dotenv').config()

const SMSHandler = async (recipients,message) => {
    const token = process.env.SMS_TOKEN;
    try {
        const url = "https://sms.centricltd.co.ke/api/v2/send_sms";

        const headers = {
            "Authorization": `Bearer ${token}`,  // Ensure token is passed dynamically
            "Content-Type": "application/json",
            "Accept": "application/json",
        };

        const body = JSON.stringify({
            "client_code": "EBK",
            "short_code": "EBK_INFO",
            "recipients": recipients,
            "message": message,
            "reference": "123456",
            "call_back": "https://example.com"
        });

        const response = await fetch(url, {
            method: "POST",
            headers,
            body
        });

        if (!response.ok) {
            throw new Error(`HTTP Error: ${response.status} - ${response.statusText}`);
        }

        const data = await response.json();
        return { success: true, data };

    } catch (err) {
        return { success: false, error: err.message };
    }
};

module.exports = {SMSHandler}