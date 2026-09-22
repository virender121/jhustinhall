const nodemailer = require("nodemailer");

module.exports = async function handler(req, res) {

    if (req.method !== "POST") {
        return res.status(405).json({
            error: "Method not allowed"
        });
    }

    try {

        const {
            name,
            email,
            phone,
            subject,
            message
        } = req.body || {};


        // ==============================
        // VALIDATION
        // ==============================

        if (!name || !email || !message) {

            return res.status(400).json({
                error: "Name, email and message are required."
            });

        }


        // ==============================
        // EMAIL TRANSPORT
        // ==============================

        const transporter = nodemailer.createTransport({

            host: process.env.SMTP_HOST,

            port: Number(process.env.SMTP_PORT || 465),

            secure: true,

            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
            }

        });


        // ==============================
        // SEND EMAIL
        // ==============================

        await transporter.sendMail({

            from: `"Jhustin Hall Website" <${process.env.SMTP_USER}>`,

            to: "panku6688t@gmail.com",

            replyTo: email,

            subject:
                subject
                    ? `Website Contact: ${subject}`
                    : `New Website Message from ${name}`,

            html: `

                <div style="
                    font-family: Arial, sans-serif;
                    max-width: 650px;
                    margin: auto;
                    border: 1px solid #eee;
                ">

                    <div style="
                        background:#1e1d1d;
                        padding:30px;
                    ">

                        <h1 style="
                            color:#f2cf29;
                            margin:0;
                            font-size:24px;
                        ">
                            Jhustin Hall
                        </h1>

                        <p style="
                            color:#fff;
                            margin:8px 0 0;
                        ">
                            New Website Contact
                        </p>

                    </div>


                    <div style="padding:30px;">

                        <p>
                            <strong>Name:</strong><br>
                            ${escapeHtml(name)}
                        </p>

                        <p>
                            <strong>Email:</strong><br>
                            ${escapeHtml(email)}
                        </p>

                        <p>
                            <strong>Phone:</strong><br>
                            ${escapeHtml(phone || "Not provided")}
                        </p>

                        <p>
                            <strong>Subject:</strong><br>
                            ${escapeHtml(subject || "General Inquiry")}
                        </p>

                        <hr style="
                            border:0;
                            border-top:1px solid #eee;
                            margin:25px 0;
                        ">

                        <p>
                            <strong>Message:</strong>
                        </p>

                        <p style="
                            line-height:1.7;
                            white-space:pre-wrap;
                        ">${escapeHtml(message)}</p>

                    </div>

                </div>

            `

        });


        return res.status(200).json({
            success: true,
            message: "Message sent successfully."
        });


    } catch (error) {

        console.error("Contact email error:", error);

        return res.status(500).json({
            error: "Unable to send email."
        });

    }

};


function escapeHtml(value = "") {

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}