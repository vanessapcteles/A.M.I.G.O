import { useEffect } from 'react';
import { authService } from '../services/authService';

const ChatWidget = () => {
    useEffect(() => {
        const TAWK_PROPERTY_ID = '6973f8914a0f82197e62106d';
        const TAWK_WIDGET_ID = '1jgsae490';

        if (document.getElementById('tawkToScript')) {
            console.log('⚠️ Tawk.to já está carregado');
            return;
        }

        // Inicializa a API do Tawk.to
        window.Tawk_API = window.Tawk_API || {};
        window.Tawk_LoadStart = new Date();

        // Cria e injeta o script do Tawk.to
        const script = document.createElement('script');
        script.id = 'tawkToScript';
        script.async = true;
        script.src = `https://embed.tawk.to/${TAWK_PROPERTY_ID}/${TAWK_WIDGET_ID}`;
        script.charset = 'UTF-8';
        script.setAttribute('crossorigin', '*');

        const firstScript = document.getElementsByTagName('script')[0];
        firstScript.parentNode.insertBefore(script, firstScript);

        // Configuração quando o widget carregar
        window.Tawk_API.onLoad = function () {
            console.log('✅ Tawk.to chat carregado com sucesso!');

            // Integra dados do usuário logado (se disponível)
            try {
                const user = authService.getCurrentUser();
                if (user) {
                    window.Tawk_API.setAttributes({
                        'name': user.nome || 'Usuário',
                        'email': user.email || '',
                        'role': user.tipo_utilizador || 'Visitante',
                        'userId': user.id_utilizador || ''
                    }, function (error) {
                        if (error) {
                            console.error('❌ Erro ao definir atributos do Tawk.to:', error);
                        } else {
                            console.log('✅ Dados do usuário enviados ao Tawk.to');
                        }
                    });
                }
            } catch (error) {
                console.warn('⚠️ Não foi possível obter dados do usuário:', error);
            }
        };

        // Tratamento de erros
        window.Tawk_API.onError = function (error) {
            console.error('❌ Erro no Tawk.to:', error);
        };

        // Cleanup quando o componente for desmontado
        return () => {
            const tawkScript = document.getElementById('tawkToScript');
            if (tawkScript) {
                tawkScript.remove();
            }

            // Remove o widget do DOM
            const tawkWidget = document.getElementById('tawkId');
            if (tawkWidget) {
                tawkWidget.remove();
            }

            // Limpa variáveis globais
            if (window.Tawk_API) {
                delete window.Tawk_API;
            }
            if (window.Tawk_LoadStart) {
                delete window.Tawk_LoadStart;
            }
        };
    }, []);

    return null; // O widget é injetado no HTML, não renderiza nada visual
};

export default ChatWidget;
