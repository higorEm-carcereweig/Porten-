"use strict";

(() => {
    const raiz = document.documentElement;
    const botaoTema = document.getElementById("alternar-tema");
    const botaoContraste = document.getElementById("alternar-contraste");
    const reduzirTexto = document.getElementById("diminuir-texto");
    const aumentarTexto = document.getElementById("aumentar-texto");
    const barraProgresso = document.getElementById("barra-progresso");
    const botoesQuiz = document.querySelectorAll(".opcoes-quiz button");
    const resposta = document.getElementById("resposta");
    const reiniciar = document.getElementById("reiniciar-quiz");
    const visualizador = document.getElementById("visualizador");
    const imagemAmpliada = document.getElementById("imagem-ampliada");
    const legendaAmpliada = document.getElementById("legenda-ampliada");
    const fecharVisualizador = document.getElementById("fechar-visualizador");

    // Preferências de leitura: mantém as escolhas entre visitas, quando possível.
    const lerPreferencia = (chave) => {
        try { return localStorage.getItem(chave); } catch { return null; }
    };
    const salvarPreferencia = (chave, valor) => {
        try { localStorage.setItem(chave, valor); } catch { /* armazenamento opcional */ }
    };

    let escalaTexto = Number(lerPreferencia("madagascar-texto") || 1);
    if (!Number.isFinite(escalaTexto)) escalaTexto = 1;
    escalaTexto = Math.min(1.25, Math.max(0.9, escalaTexto));
    raiz.style.setProperty("--escala-texto", escalaTexto);

    const temaSalvo = lerPreferencia("madagascar-tema");
    if (temaSalvo === "escuro") raiz.dataset.tema = "escuro";
    if (temaSalvo === "claro") delete raiz.dataset.tema;
    atualizarBotaoTema();

    const contrasteSalvo = lerPreferencia("madagascar-contraste") === "alto";
    if (contrasteSalvo) raiz.dataset.contraste = "alto";
    atualizarBotaoContraste();

    function atualizarBotaoTema() {
        const escuro = raiz.dataset.tema === "escuro";
        botaoTema.setAttribute("aria-pressed", String(escuro));
        botaoTema.innerHTML = escuro ? "☀ <span>Modo claro</span>" : "☾ <span>Modo escuro</span>";
    }

    function atualizarBotaoContraste() {
        const alto = raiz.dataset.contraste === "alto";
        botaoContraste.setAttribute("aria-pressed", String(alto));
        botaoContraste.setAttribute("aria-label", alto ? "Desativar contraste reforçado" : "Ativar contraste reforçado");
    }

    botaoTema.addEventListener("click", () => {
        const escuro = raiz.dataset.tema !== "escuro";
        if (escuro) raiz.dataset.tema = "escuro";
        else delete raiz.dataset.tema;
        salvarPreferencia("madagascar-tema", escuro ? "escuro" : "claro");
        atualizarBotaoTema();
    });

    botaoContraste.addEventListener("click", () => {
        const alto = raiz.dataset.contraste !== "alto";
        if (alto) raiz.dataset.contraste = "alto";
        else delete raiz.dataset.contraste;
        salvarPreferencia("madagascar-contraste", alto ? "alto" : "normal");
        atualizarBotaoContraste();
    });

    function aplicarEscalaTexto() {
        raiz.style.setProperty("--escala-texto", escalaTexto.toFixed(2));
        salvarPreferencia("madagascar-texto", escalaTexto.toFixed(2));
    }
    reduzirTexto.addEventListener("click", () => {
        escalaTexto = Math.max(0.9, Number((escalaTexto - 0.05).toFixed(2)));
        aplicarEscalaTexto();
    });
    aumentarTexto.addEventListener("click", () => {
        escalaTexto = Math.min(1.25, Number((escalaTexto + 0.05).toFixed(2)));
        aplicarEscalaTexto();
    });

    // Indicador discreto de quanto da página já foi percorrido.
    let quadroAgendado = false;
    function atualizarProgresso() {
        const alturaUtil = document.documentElement.scrollHeight - window.innerHeight;
        const porcentagem = alturaUtil > 0 ? (window.scrollY / alturaUtil) * 100 : 0;
        barraProgresso.style.width = `${Math.min(100, Math.max(0, porcentagem))}%`;
        quadroAgendado = false;
    }
    window.addEventListener("scroll", () => {
        if (!quadroAgendado) {
            window.requestAnimationFrame(atualizarProgresso);
            quadroAgendado = true;
        }
    }, { passive: true });
    window.addEventListener("resize", atualizarProgresso);
    atualizarProgresso();

    // Marca no menu a seção que está visível.
    const secoes = document.querySelectorAll("main section[id]");
    const linksMenu = document.querySelectorAll(".menu-links a");
    if ("IntersectionObserver" in window) {
        const observador = new IntersectionObserver((entradas) => {
            entradas.forEach((entrada) => {
                if (!entrada.isIntersecting) return;
                linksMenu.forEach((link) => {
                    if (link.getAttribute("href") === `#${entrada.target.id}`) {
                        link.setAttribute("aria-current", "location");
                    } else {
                        link.removeAttribute("aria-current");
                    }
                });
            });
        }, { rootMargin: "-25% 0px -60% 0px" });
        secoes.forEach((secao) => observador.observe(secao));
    }

    // Quiz com resposta anunciada por leitores de tela.
    function responder(alternativa) {
        if (!resposta || !reiniciar) return;
        botoesQuiz.forEach((botao) => {
            botao.disabled = true;
            botao.classList.remove("correta", "incorreta");
        });
        const selecionado = document.querySelector(`[data-alternativa="${alternativa}"]`);
        const correto = document.querySelector('[data-alternativa="C"]');
        if (alternativa === "C") {
            resposta.textContent = "✓ Correto! O chiado é produzido pela expulsão de ar através dos espiráculos respiratórios.";
            resposta.className = "feedback correta";
            selecionado?.classList.add("correta");
        } else {
            resposta.textContent = "Não foi dessa vez. Ela libera ar pelos espiráculos respiratórios. A alternativa correta é C.";
            resposta.className = "feedback incorreta";
            selecionado?.classList.add("incorreta");
            correto?.classList.add("correta");
        }
        reiniciar.hidden = false;
    }

    function reiniciarQuiz() {
        botoesQuiz.forEach((botao) => {
            botao.disabled = false;
            botao.classList.remove("correta", "incorreta");
        });
        resposta.textContent = "";
        resposta.className = "feedback";
        reiniciar.hidden = true;
    }

    botoesQuiz.forEach((botao) => botao.addEventListener("click", () => responder(botao.dataset.alternativa)));
    reiniciar.addEventListener("click", reiniciarQuiz);

    // Galeria ampliável usando <dialog>, com fechamento por Esc e clique no fundo.
    document.querySelectorAll(".abrir-foto").forEach((botao) => {
        botao.addEventListener("click", () => {
            const imagem = botao.dataset.imagem;
            if (!imagem || !visualizador.showModal) return;
            imagemAmpliada.src = imagem;
            imagemAmpliada.alt = botao.querySelector("img")?.alt || "Imagem ampliada";
            legendaAmpliada.textContent = botao.dataset.legenda || "";
            visualizador.showModal();
            fecharVisualizador.focus();
        });
    });
    fecharVisualizador.addEventListener("click", () => visualizador.close());
    visualizador.addEventListener("click", (evento) => {
        if (evento.target === visualizador) visualizador.close();
    });
    visualizador.addEventListener("close", () => {
        imagemAmpliada.src = "";
    });
})();
