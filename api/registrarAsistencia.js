export default async function handler(req, res) {

    if (req.method !== 'POST') {
        return res.status(405).json({
            error: 'Método no permitido'
        });
    }

    try {

        const { nombre, correo } = req.body;

        if (!nombre || !correo) {
            return res.status(400).json({
                error: 'Faltan datos'
            });
        }

        const response = await fetch(
            'https://api.resend.com/emails',
            {
                method: 'POST',

                headers: {
                    'Authorization':
                        `Bearer ${process.env.RESEND_API_KEY}`,
                    'Content-Type': 'application/json'
                },

                body: JSON.stringify({
                    from: 'Eventos <onboarding@resend.dev>',
                    to: [correo],
                    subject: 'Confirmación de asistencia',

                    html: `
                        <h2>Hola ${nombre}</h2>

                        <p>
                            Tu asistencia fue confirmada correctamente.
                        </p>

                        <p>
                            ¡Te esperamos!
                        </p>
                    `
                })
            }
        );

        if (!response.ok) {

            const error = await response.text();

            console.error(error);

            return res.status(500).json({
                error: 'Error enviando correo'
            });
        }

        return res.status(200).json({
            mensaje: 'Registro exitoso'
        });

    } catch (error) {

        console.error(error);

        return res.status(500).json({
            error: 'Error interno'
        });
    }
}