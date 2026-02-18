import { useEffect } from 'react';
import { authService } from '../services/authService';

const ChatWidget = () => {
    useEffect(() => {
        const TAWK_PROPERTY_ID = '6973f8914a0f82197e62106d';
        const TAWK_WIDGET_ID = '1jgsae490';

        const scriptId = 'tawkToScript';

        // Função para carregar o widget
        const loadWidget = () => {
            // Se já existir o script, não fazemos nada (mas atualizamos user)
            if (document.getElementById(scriptId)) {
                updateUser();
                return;
            }

            // Inicializa variáveis globais
            window.Tawk_API = window.Tawk_API || {};
            window.Tawk_LoadStart = new Date();

            // Cria o script
            const s1 = document.createElement("script");
            const s0 = document.getElementsByTagName("script")[0];
            s1.id = scriptId;
            s1.async = true;
            s1.src = `https://embed.tawk.to/${TAWK_PROPERTY_ID}/${TAWK_WIDGET_ID}`;
            s1.charset = 'UTF-8';
            s1.setAttribute('crossorigin', '*');

            // Define o callback de load ANTES de injetar
            s1.onload = () => {
                updateUser();
            };

            s0.parentNode.insertBefore(s1, s0);
        };

        // Função para atualizar dados do utilizador
        const updateUser = () => {
            if (window.Tawk_API && window.Tawk_API.setAttributes) {
                try {
                    const user = authService.getCurrentUser();
                    if (user) {
                        window.Tawk_API.setAttributes({
                            'name': user.nome_completo || user.nome || 'Utilizador',
                            'email': user.email || '',
                            'role': user.tipo_utilizador || 'Visitante',
                            'hash': user.id  // Útil para identificar
                        }, function (error) { });
                    }
                } catch (e) { console.warn(e); }
            }
        };

        loadWidget();

        // Cleanup
        return () => {
            // Não removemos o script para evitar quebras se o user apenas mudar de página
            // Mas podemos esconder o widget se necessário
            if (window.Tawk_API && window.Tawk_API.hideWidget) {
                window.Tawk_API.hideWidget();
            }
        };
    }, []);

    return null;
};

export default ChatWidget;
