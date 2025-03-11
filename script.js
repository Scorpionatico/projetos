const Diario = {
    dados: {
        escola: JSON.parse(localStorage.getItem('escola')) || null,
        disciplinas: JSON.parse(localStorage.getItem('disciplinas')) || [],
        turmasIndependentes: JSON.parse(localStorage.getItem('turmasIndependentes')) || [],
        combinacoes: JSON.parse(localStorage.getItem('combinacoes')) || {},
        combinacaoAtual: null,
        turmaAtual: null,
        disciplinaAtual: null
    },

    funcoes: {
        mostrarNotificacao(mensagem, tipo = 'sucesso') {
            let div = document.createElement('div');
            div.innerText = mensagem;
            div.className = `notificacao ${tipo}`;
            document.body.appendChild(div);
            setTimeout(() => {
                div.style.opacity = '0';
                setTimeout(() => div.remove(), 500);
            }, 3000);
        },

        esconderTelas() {
            document.getElementById("config-inicial").style.display = "none";
            document.getElementById("capa").style.display = "none";
            document.getElementById("tela-disciplinas").style.display = "none";
            document.getElementById("tela-alunos").style.display = "none";
            document.getElementById("tela-turmas-independentes").style.display = "none";
            document.getElementById("tela-gerenciar-aulas").style.display = "none";
            document.getElementById("tela-combinacao").style.display = "none";
            document.getElementById("tela-frequencia").style.display = "none";
            document.getElementById("tela-notas").style.display = "none";
            document.getElementById("tela-conteudo").style.display = "none";
            document.getElementById("tela-config-bimestres").style.display = "none";
            document.getElementById("tela-atividades").style.display = "none";
            document.getElementById("tela-recuperacao").style.display = "none";
        },

        formatarData(data, short = false) {
            let date = new Date(data + 'T00:00:00');
            if (short) {
                return `${date.getDate()}/${date.getMonth() + 1}`;
            }
            return date.toLocaleDateString('pt-BR');
        },

        arredondarNota(nota) {
            let arredondada = Math.round(nota * 2) / 2;
            return arredondada.toFixed(1);
        },

        calcularMediaBimestral(notas) {
            let validas = notas.filter(n => n !== "" && n !== null && !isNaN(n)).map(Number);
            if (validas.length === 0) return "-";
            if (validas.length <= 2) {
                let media = validas.reduce((a, b) => a + b, 0) / validas.length;
                return Diario.funcoes.arredondarNota(media);
            }
            validas.sort((a, b) => b - a);
            let media = (validas[0] + validas[1]) / 2;
            return Diario.funcoes.arredondarNota(media);
        },

        calcularMediaGeral(bimestres) {
            let medias = bimestres.map(b => Diario.funcoes.calcularMediaBimestral(b)).filter(m => m !== "-");
            if (medias.length === 0) return "-";
            let soma = medias.reduce((a, b) => parseFloat(a) + parseFloat(b), 0);
            return Diario.funcoes.arredondarNota(soma / medias.length);
        },

        atualizarDadosAluno(turmaNome, index, novoNome) {
            let alunoAntigo = Diario.dados.turmasIndependentes.find(t => t.nome === turmaNome).alunos[index];
            let nomeAntigo = `${alunoAntigo.numero}. ${alunoAntigo.nome}`;
            let nomeNovo = `${alunoAntigo.numero}. ${novoNome}`;
            Object.keys(Diario.dados.combinacoes).forEach(combinacao => {
                if (combinacao.split(" - ")[1] === turmaNome) {
                    Diario.dados.combinacoes[combinacao].frequencia.forEach(f => {
                        let registro = f.registros.find(r => r.aluno === nomeAntigo);
                        if (registro) registro.aluno = nomeNovo;
                    });
                    Diario.dados.combinacoes[combinacao].notas.forEach(n => {
                        if (n.aluno === nomeAntigo) n.aluno = nomeNovo;
                    });
                    Diario.dados.combinacoes[combinacao].atividades.forEach(a => {
                        let registro = a.registros.find(r => r.aluno === nomeAntigo);
                        if (registro) registro.aluno = nomeNovo;
                    });
                }
            });
            localStorage.setItem('combinacoes', JSON.stringify(Diario.dados.combinacoes));
        },

        atualizarDadosTurma(nomeAntigo, novoNome) {
            let combinacoesAtualizadas = {};
            Object.keys(Diario.dados.combinacoes).forEach(combinacao => {
                let [disciplina, turma] = combinacao.split(" - ");
                if (turma === nomeAntigo) {
                    let novaChave = `${disciplina} - ${novoNome}`;
                    combinacoesAtualizadas[novaChave] = Diario.dados.combinacoes[combinacao];
                } else {
                    combinacoesAtualizadas[combinacao] = Diario.dados.combinacoes[combinacao];
                }
            });
            Diario.dados.combinacoes = combinacoesAtualizadas;
            if (Diario.dados.combinacaoAtual && Diario.dados.combinacaoAtual.split(" - ")[1] === nomeAntigo) {
                Diario.dados.combinacaoAtual = `${Diario.dados.combinacaoAtual.split(" - ")[0]} - ${novoNome}`;
            }
            localStorage.setItem('combinacoes', JSON.stringify(Diario.dados.combinacoes));
        }
    },

    telas: {
        carregarCapa() {
            Diario.funcoes.esconderTelas();
            document.getElementById("capa").style.display = "flex";
            if (Diario.dados.escola) {
                document.getElementById("capa-titulo").innerText = Diario.dados.escola.nomeEscola.toUpperCase();
                document.getElementById("capa-curso").innerText = Diario.dados.escola.curso;
                document.getElementById("capa-ano").innerText = Diario.dados.escola.anoLetivo;
                document.getElementById("capa-professor").innerText = Diario.dados.escola.professor;
            } else {
                document.getElementById("capa-titulo").innerText = "";
                document.getElementById("capa-curso").innerText = "";
                document.getElementById("capa-ano").innerText = "";
                document.getElementById("capa-professor").innerText = "";
            }
        },

        salvarConfigInicial() {
            let nomeEscola = document.getElementById("nome-escola").value.trim();
            let curso = document.getElementById("curso").value.trim();
            let anoLetivo = document.getElementById("ano-letivo").value.trim();
            let professor = document.getElementById("nome-professor").value.trim();
        
            if (!nomeEscola || !curso || !anoLetivo || !professor) {
                Diario.funcoes.mostrarNotificacao("Preencha todos os campos!", "erro");
                return;
            }
        
            Diario.dados.escola = {
                nomeEscola: nomeEscola,
                curso: curso,
                anoLetivo: anoLetivo,
                professor: professor
            };
            localStorage.setItem('escola', JSON.stringify(Diario.dados.escola));
            document.getElementById("config-inicial").style.display = "none";
            Diario.telas.carregarCapa();
            Diario.funcoes.mostrarNotificacao("Configuração salva com sucesso!");
        },

        editarConfig() {
            Diario.funcoes.esconderTelas();
            document.getElementById("config-inicial").style.display = "block";
            document.getElementById("nome-escola").value = Diario.dados.escola.nomeEscola;
            document.getElementById("curso").value = Diario.dados.escola.curso;
            document.getElementById("ano-letivo").value = Diario.dados.escola.anoLetivo;
            document.getElementById("nome-professor").value = Diario.dados.escola.professor;
            // Adiciona o botão "Limpar Dados" dinamicamente
            let configDiv = document.getElementById("config-inicial");
            if (!document.getElementById("btn-limpar-dados")) {
                let btnLimpar = document.createElement("button");
                btnLimpar.id = "btn-limpar-dados";
                btnLimpar.innerText = "Limpar Dados";
                btnLimpar.style.background = "#ff4444";
                btnLimpar.style.color = "white";
                btnLimpar.onclick = Diario.telas.limparDados;
                configDiv.appendChild(btnLimpar);
            }
        },

        mostrarDisciplinas() {
            Diario.funcoes.esconderTelas();
            document.getElementById("tela-disciplinas").style.display = "block";
            Diario.telas.carregarDisciplinas();
            document.getElementById("nova-disciplina").focus();
        },

        carregarDisciplinas() {
            let lista = document.getElementById("lista-disciplinas");
            lista.innerHTML = "";
            Diario.dados.disciplinas.forEach((disciplina, index) => {
                lista.innerHTML += `
                    <div class="disciplina">
                        ${disciplina.nome}
                        <button onclick="Diario.telas.editarDisciplina(${index})">Editar</button>
                        <button onclick="Diario.telas.removerDisciplina(${index})">Remover</button>
                    </div>`;
            });
        },

        adicionarDisciplina() {
            let nome = document.getElementById("nova-disciplina").value.trim();
            if (!nome) {
                Diario.funcoes.mostrarNotificacao("Digite um nome válido para a disciplina!", "erro");
                return;
            }
            if (Diario.dados.disciplinas.some(d => d.nome.toLowerCase() === nome.toLowerCase())) {
                Diario.funcoes.mostrarNotificacao("Essa disciplina já existe!", "erro");
                return;
            }
            Diario.dados.disciplinas.push({ nome: nome });
            localStorage.setItem('disciplinas', JSON.stringify(Diario.dados.disciplinas));
            document.getElementById("nova-disciplina").value = "";
            Diario.telas.carregarDisciplinas();
            Diario.funcoes.mostrarNotificacao("Disciplina adicionada com sucesso!");
            document.getElementById("nova-disciplina").focus();
        },

        editarDisciplina(index) {
            let novoNome = prompt("Novo nome da disciplina:", Diario.dados.disciplinas[index].nome);
            if (novoNome) {
                if (Diario.dados.disciplinas.some((d, i) => i !== index && d.nome.toLowerCase() === novoNome.toLowerCase())) {
                    Diario.funcoes.mostrarNotificacao("Essa disciplina já existe!", "erro");
                    return;
                }
                Diario.dados.disciplinas[index].nome = novoNome;
                localStorage.setItem('disciplinas', JSON.stringify(Diario.dados.disciplinas));
                Diario.telas.carregarDisciplinas();
                Diario.funcoes.mostrarNotificacao("Disciplina editada com sucesso!");
            }
        },

        removerDisciplina(index) {
            if (confirm(`Tem certeza que deseja remover a disciplina "${Diario.dados.disciplinas[index].nome}"?`)) {
                Diario.dados.disciplinas.splice(index, 1);
                localStorage.setItem('disciplinas', JSON.stringify(Diario.dados.disciplinas));
                Diario.telas.carregarDisciplinas();
                Diario.funcoes.mostrarNotificacao("Disciplina removida com sucesso!");
            }
        },

        mostrarTurmasIndependentes() {
            Diario.funcoes.esconderTelas();
            document.getElementById("tela-turmas-independentes").style.display = "block";
            Diario.telas.carregarTurmasIndependentes();
            document.getElementById("nova-turma-independente").focus();
        },

        carregarTurmasIndependentes() {
            let lista = document.getElementById("lista-turmas-independentes");
            lista.innerHTML = "";
            Diario.dados.turmasIndependentes.forEach((turma, index) => {
                lista.innerHTML += `
                    <div class="turma" onclick="Diario.telas.abrirTurmaIndependente('${turma.nome}')">
                        ${turma.nome}
                        <button onclick="event.stopPropagation(); Diario.telas.editarTurmaIndependente(${index})">Editar</button>
                        <button onclick="event.stopPropagation(); Diario.telas.removerTurmaIndependente(${index})">Remover</button>
                    </div>`;
            });
        },

        adicionarTurmaIndependente() {
            let nome = document.getElementById("nova-turma-independente").value.trim();
            if (!nome) {
                Diario.funcoes.mostrarNotificacao("Digite um nome válido para a turma!", "erro");
                return;
            }
            if (Diario.dados.turmasIndependentes.some(t => t.nome.toLowerCase() === nome.toLowerCase())) {
                Diario.funcoes.mostrarNotificacao("Essa turma já existe!", "erro");
                return;
            }
            Diario.dados.turmasIndependentes.push({ nome: nome, alunos: [], faltas: [] });
            localStorage.setItem('turmasIndependentes', JSON.stringify(Diario.dados.turmasIndependentes));
            document.getElementById("nova-turma-independente").value = "";
            Diario.telas.carregarTurmasIndependentes();
            Diario.funcoes.mostrarNotificacao("Turma adicionada com sucesso!");
            document.getElementById("nova-turma-independente").focus();
        },

        editarTurmaIndependente(index) {
            let nomeAntigo = Diario.dados.turmasIndependentes[index].nome;
            let novoNome = prompt("Novo nome da turma:", nomeAntigo);
            if (novoNome) {
                if (Diario.dados.turmasIndependentes.some((t, i) => i !== index && t.nome.toLowerCase() === novoNome.toLowerCase())) {
                    Diario.funcoes.mostrarNotificacao("Essa turma já existe!", "erro");
                    return;
                }
                Diario.funcoes.atualizarDadosTurma(nomeAntigo, novoNome);
                Diario.dados.turmasIndependentes[index].nome = novoNome;
                localStorage.setItem('turmasIndependentes', JSON.stringify(Diario.dados.turmasIndependentes));
                Diario.telas.carregarTurmasIndependentes();
                Diario.funcoes.mostrarNotificacao("Turma editada com sucesso!");
            }
        },

        removerTurmaIndependente(index) {
            let turmaNome = Diario.dados.turmasIndependentes[index].nome;
            let combinacoesAssociadas = Object.keys(Diario.dados.combinacoes).filter(c => c.split(" - ")[1] === turmaNome);
            let mensagem = combinacoesAssociadas.length > 0 
                ? `Esta turma está associada a ${combinacoesAssociadas.length} combinação(ões) (ex.: ${combinacoesAssociadas[0]}). Deseja remover a turma "${turmaNome}" e todas as combinações relacionadas?`
                : `Tem certeza que deseja remover a turma "${turmaNome}"?`;
            if (confirm(mensagem)) {
                Diario.dados.turmasIndependentes.splice(index, 1);
                combinacoesAssociadas.forEach(c => delete Diario.dados.combinacoes[c]);
                localStorage.setItem('turmasIndependentes', JSON.stringify(Diario.dados.turmasIndependentes));
                localStorage.setItem('combinacoes', JSON.stringify(Diario.dados.combinacoes));
                Diario.telas.carregarTurmasIndependentes();
                Diario.funcoes.mostrarNotificacao("Turma removida com sucesso!");
            }
        },

        abrirTurmaIndependente(nome) {
            Diario.dados.turmaAtual = Diario.dados.turmasIndependentes.find(t => t.nome === nome);
            Diario.dados.disciplinaAtual = null;
            document.getElementById("tela-turmas-independentes").style.display = "none";
            document.getElementById("tela-alunos").style.display = "block";
            document.getElementById("nome-turma").innerText = `Turma: ${nome}`;
            Diario.telas.carregarAlunos();
            document.getElementById("novo-aluno").style.display = "block";
            document.getElementById("add-aluno-btn").style.display = "block";
            document.getElementById("novo-aluno").focus();
        },

        carregarAlunos() {
            let lista = document.getElementById("lista-alunos");
            lista.innerHTML = "";
            Diario.dados.turmaAtual.alunos.forEach((aluno, index) => {
                lista.innerHTML += `
                    <div class="aluno">
                        ${aluno.numero}. ${aluno.nome}
                        <button onclick="Diario.telas.editarAluno(${index})">Editar</button>
                        <button onclick="Diario.telas.removerAluno(${index})">Remover</button>
                    </div>`;
            });
        },

        adicionarAluno() {
            if (!Diario.dados.disciplinaAtual) {
                let nome = document.getElementById("novo-aluno").value.trim();
                if (!nome) {
                    Diario.funcoes.mostrarNotificacao("Digite um nome válido para o aluno!", "erro");
                    return;
                }
                let numero = Diario.dados.turmaAtual.alunos.length + 1;
                Diario.dados.turmaAtual.alunos.push({ nome: nome, numero: numero });
                localStorage.setItem('turmasIndependentes', JSON.stringify(Diario.dados.turmasIndependentes));
                document.getElementById("novo-aluno").value = "";
                Diario.telas.carregarAlunos();
                Diario.funcoes.mostrarNotificacao("Aluno adicionado com sucesso!");
                document.getElementById("novo-aluno").focus();
            }
        },

        editarAluno(index) {
            let novoNome = prompt("Novo nome do aluno:", Diario.dados.turmaAtual.alunos[index].nome);
            if (novoNome) {
                let turmaNome = Diario.dados.turmaAtual.nome;
                Diario.funcoes.atualizarDadosAluno(turmaNome, index, novoNome);
                Diario.dados.turmaAtual.alunos[index].nome = novoNome;
                localStorage.setItem('turmasIndependentes', JSON.stringify(Diario.dados.turmasIndependentes));
                Diario.telas.carregarAlunos();
                Diario.funcoes.mostrarNotificacao("Aluno editado com sucesso!");
            }
        },

        removerAluno(index) {
            if (confirm(`Tem certeza que deseja remover o aluno "${Diario.dados.turmaAtual.alunos[index].nome}"?`)) {
                Diario.dados.turmaAtual.alunos.splice(index, 1);
                Diario.dados.turmaAtual.alunos.forEach((aluno, i) => aluno.numero = i + 1);
                localStorage.setItem('turmasIndependentes', JSON.stringify(Diario.dados.turmasIndependentes));
                Diario.telas.carregarAlunos();
                Diario.funcoes.mostrarNotificacao("Aluno removido com sucesso!");
            }
        },

        mostrarGerenciarAulas() {
            Diario.funcoes.esconderTelas();
            document.getElementById("tela-gerenciar-aulas").style.display = "block";
            Diario.telas.carregarDisciplinasGerenciamento();
            Diario.telas.carregarCombinacoes();
        },

        carregarDisciplinasGerenciamento() {
            let selectDisciplina = document.getElementById("disciplina-selecionada");
            selectDisciplina.innerHTML = "<option value=''>Selecione uma disciplina</option>";
            Diario.dados.disciplinas.forEach(disciplina => {
                selectDisciplina.innerHTML += `<option value="${disciplina.nome}">${disciplina.nome}</option>`;
            });
            selectDisciplina.onchange = function() { Diario.telas.carregarTurmasGerenciamento(); };
            Diario.telas.carregarTurmasGerenciamento();
        },

        carregarTurmasGerenciamento() {
            let selectTurma = document.getElementById("turma-selecionada");
            selectTurma.innerHTML = "<option value=''>Selecione uma turma</option>";
            Diario.dados.turmasIndependentes.forEach(turma => {
                selectTurma.innerHTML += `<option value="${turma.nome}">${turma.nome}</option>`;
            });
        },

        adicionarCombinacao() {
            let disciplinaNome = document.getElementById("disciplina-selecionada").value;
            let turmaNome = document.getElementById("turma-selecionada").value;
            if (!disciplinaNome || !turmaNome) {
                Diario.funcoes.mostrarNotificacao("Selecione uma disciplina e uma turma!", "erro");
                return;
            }
            let combinacao = `${disciplinaNome} - ${turmaNome}`;
            if (Diario.dados.combinacoes[combinacao]) {
                Diario.funcoes.mostrarNotificacao("Essa combinação já existe!", "erro");
                return;
            }
            Diario.dados.combinacoes[combinacao] = { 
                bimestres: [
                    { inicio: "2025-02-01", fim: "2025-04-30" },
                    { inicio: "2025-05-01", fim: "2025-07-31" },
                    { inicio: "2025-08-01", fim: "2025-10-31" },
                    { inicio: "2025-11-01", fim: "2025-12-31" }
                ],
                frequencia: [], 
                conteudo: [], 
                notas: [], 
                atividades: [], 
                recuperacao: [] 
            };
            localStorage.setItem('combinacoes', JSON.stringify(Diario.dados.combinacoes));
            Diario.telas.carregarCombinacoes();
            Diario.funcoes.mostrarNotificacao("Combinação adicionada com sucesso!");
        },

        carregarCombinacoes() {
            let conteudo = document.getElementById("gerenciamento-conteudo");
            conteudo.innerHTML = "";
            Object.keys(Diario.dados.combinacoes).forEach(combinacao => {
                conteudo.innerHTML += `
                    <div class="combinacao-btn">
                        <span onclick="Diario.telas.mostrarCombinacao('${combinacao}')">${combinacao}</span>
                        <button onclick="Diario.telas.removerCombinacao('${combinacao}')">Remover</button>
                    </div>
                `;
            });
        },

        removerCombinacao(combinacao) {
            if (confirm(`Tem certeza que deseja remover a combinação "${combinacao}"?`)) {
                delete Diario.dados.combinacoes[combinacao];
                localStorage.setItem('combinacoes', JSON.stringify(Diario.dados.combinacoes));
                Diario.telas.carregarCombinacoes();
                Diario.funcoes.mostrarNotificacao("Combinação removida com sucesso!");
            }
        },

        mostrarCombinacao(combinacao) {
            Diario.dados.combinacaoAtual = combinacao;
            Diario.funcoes.esconderTelas();
            document.getElementById("tela-combinacao").style.display = "block";
            document.getElementById("combinacao-titulo").innerText = combinacao;
            Diario.telas.mostrarResumo('frequencia');
        },

        mostrarConfigBimestres() {
            Diario.funcoes.esconderTelas();
            document.getElementById("tela-config-bimestres").style.display = "block";
            document.getElementById("combinacao-config-nome").innerText = Diario.dados.combinacaoAtual;
            let bimestres = Diario.dados.combinacoes[Diario.dados.combinacaoAtual].bimestres;
            document.getElementById("bimestre1-inicio").value = bimestres[0].inicio;
            document.getElementById("bimestre1-fim").value = bimestres[0].fim;
            document.getElementById("bimestre2-inicio").value = bimestres[1].inicio;
            document.getElementById("bimestre2-fim").value = bimestres[1].fim;
            document.getElementById("bimestre3-inicio").value = bimestres[2].inicio;
            document.getElementById("bimestre3-fim").value = bimestres[2].fim;
            document.getElementById("bimestre4-inicio").value = bimestres[3].inicio;
            document.getElementById("bimestre4-fim").value = bimestres[3].fim;
        },

        configurarBimestres() {
            let combinacao = document.getElementById("combinacao-config-nome").innerText;
            let bimestres = [
                { inicio: document.getElementById("bimestre1-inicio").value, fim: document.getElementById("bimestre1-fim").value },
                { inicio: document.getElementById("bimestre2-inicio").value, fim: document.getElementById("bimestre2-fim").value },
                { inicio: document.getElementById("bimestre3-inicio").value, fim: document.getElementById("bimestre3-fim").value },
                { inicio: document.getElementById("bimestre4-inicio").value, fim: document.getElementById("bimestre4-fim").value }
            ];
            if (bimestres.every(b => b.inicio && b.fim)) {
                Diario.dados.combinacoes[combinacao].bimestres = bimestres;
                localStorage.setItem('combinacoes', JSON.stringify(Diario.dados.combinacoes));
                Diario.telas.voltarCombinacao();
                Diario.funcoes.mostrarNotificacao("Bimestres configurados com sucesso!");
            } else {
                Diario.funcoes.mostrarNotificacao("Preencha todas as datas dos bimestres!", "erro");
            }
        },

        construirTabelaFrequencia(turma) {
            let tabelaHTML = `
                <h3>Faltas por Bimestre</h3>
                <table>
                    <thead>
                        <tr>
                            <th>Aluno</th>
                            <th>1º Bimestre</th>
                            <th>2º Bimestre</th>
                            <th>3º Bimestre</th>
                            <th>4º Bimestre</th>
                            <th>Total</th>
                        </tr>
                    </thead>
                    <tbody>
            `;
            if (!Diario.dados.combinacoes[Diario.dados.combinacaoAtual].frequencia.length) {
                tabelaHTML += `<tr><td colspan="6">Nenhuma frequência registrada</td></tr>`;
            } else {
                turma.alunos.forEach(aluno => {
                    let faltasPorBimestre = [0, 0, 0, 0];
                    let justificadasPorBimestre = [0, 0, 0, 0];
                    let totalFaltas = 0;
                    let totalJustificadas = 0;

                    Diario.dados.combinacoes[Diario.dados.combinacaoAtual].frequencia.forEach(f => {
                        let data = new Date(f.data + 'T00:00:00');
                        let registro = f.registros.find(r => r.aluno === `${aluno.numero}. ${aluno.nome}`);
                        if (registro) {
                            let valor = registro.tipo === 'F' || registro.tipo === 'J' ? 1 : registro.tipo === 'D' || registro.tipo === 'JD' ? 2 : 0;
                            let justificada = registro.tipo === 'J' ? 1 : registro.tipo === 'JD' ? 2 : 0;

                            Diario.dados.combinacoes[Diario.dados.combinacaoAtual].bimestres.forEach((bimestre, index) => {
                                let inicio = new Date(bimestre.inicio + 'T00:00:00');
                                let fim = new Date(bimestre.fim + 'T00:00:00');
                                if (data >= inicio && data <= fim) {
                                    faltasPorBimestre[index] += valor;
                                    justificadasPorBimestre[index] += justificada;
                                }
                            });
                            totalFaltas += valor;
                            totalJustificadas += justificada;
                        }
                    });

                    tabelaHTML += `
                        <tr>
                            <td>${aluno.numero}. ${aluno.nome}</td>
                            <td><span style="color: red;">${faltasPorBimestre[0]}</span> <span style="color: blue;">(${justificadasPorBimestre[0]})</span></td>
                            <td><span style="color: red;">${faltasPorBimestre[1]}</span> <span style="color: blue;">(${justificadasPorBimestre[1]})</span></td>
                            <td><span style="color: red;">${faltasPorBimestre[2]}</span> <span style="color: blue;">(${justificadasPorBimestre[2]})</span></td>
                            <td><span style="color: red;">${faltasPorBimestre[3]}</span> <span style="color: blue;">(${justificadasPorBimestre[3]})</span></td>
                            <td><span style="color: red;">${totalFaltas}</span> <span style="color: blue;">(${totalJustificadas})</span></td>
                        </tr>
                    `;
                });
            }
            tabelaHTML += "</tbody></table>";
            return tabelaHTML;
        },

        construirTabelaHistoricoFrequencia(turma, bimestreIdx) {
            let registros = Diario.dados.combinacoes[Diario.dados.combinacaoAtual].frequencia.filter(f => {
                let data = new Date(f.data + 'T00:00:00');
                let inicio = new Date(Diario.dados.combinacoes[Diario.dados.combinacaoAtual].bimestres[bimestreIdx].inicio + 'T00:00:00');
                let fim = new Date(Diario.dados.combinacoes[Diario.dados.combinacaoAtual].bimestres[bimestreIdx].fim + 'T00:00:00');
                return data >= inicio && data <= fim;
            }).sort((a, b) => new Date(a.data) - new Date(b.data));

            let tabelaHTML = `
                <h3>Histórico Detalhado - ${bimestreIdx + 1}º Bimestre</h3>
                <div>
                    <button class="aba" onclick="Diario.telas.mostrarHistoricoFrequencia(0)">1º Bimestre</button>
                    <button class="aba" onclick="Diario.telas.mostrarHistoricoFrequencia(1)">2º Bimestre</button>
                    <button class="aba" onclick="Diario.telas.mostrarHistoricoFrequencia(2)">3º Bimestre</button>
                    <button class="aba" onclick="Diario.telas.mostrarHistoricoFrequencia(3)">4º Bimestre</button>
                </div>
                <table>
                    <thead><tr><th>Aluno</th>
            `;
            registros.forEach(f => {
                tabelaHTML += `<th>${Diario.funcoes.formatarData(f.data, true)}</th>`;
            });
            tabelaHTML += `</tr></thead><tbody>`;

            if (registros.length === 0) {
                tabelaHTML += `<tr><td colspan="${registros.length + 1}">Nenhuma frequência registrada neste bimestre</td></tr>`;
            } else {
                turma.alunos.forEach(aluno => {
                    tabelaHTML += `<tr><td>${aluno.numero}. ${aluno.nome}</td>`;
                    registros.forEach(f => {
                        let registro = f.registros.find(r => r.aluno === `${aluno.numero}. ${aluno.nome}`);
                        tabelaHTML += `<td>${registro ? registro.tipo : '-'}</td>`;
                    });
                    tabelaHTML += `</tr>`;
                });
            }
            tabelaHTML += `</tbody></table>`;
            return tabelaHTML;
        },

        construirTabelaAtividades(turma) {
            let atividades = Diario.dados.combinacoes[Diario.dados.combinacaoAtual].atividades || [];
            let tabelaHTML = `
                <h3>Atividades por Bimestre</h3>
                <table>
                    <thead>
                        <tr>
                            <th rowspan="2">Aluno</th>
                            <th colspan="3">1º Bimestre</th>
                            <th colspan="3">2º Bimestre</th>
                            <th colspan="3">3º Bimestre</th>
                            <th colspan="3">4º Bimestre</th>
                        </tr>
                        <tr>
                            <th>C</th><th>I</th><th>N</th>
                            <th>C</th><th>I</th><th>N</th>
                            <th>C</th><th>I</th><th>N</th>
                            <th>C</th><th>I</th><th>N</th>
                        </tr>
                    </thead>
                    <tbody>
            `;
            if (atividades.length === 0) {
                tabelaHTML += `<tr><td colspan="13">Nenhuma atividade registrada</td></tr>`;
            } else {
                turma.alunos.forEach(aluno => {
                    tabelaHTML += `<tr><td>${aluno.numero}. ${aluno.nome}</td>`;
                    for (let i = 0; i < 4; i++) {
                        let registrosBimestre = atividades.filter(a => {
                            let data = new Date(a.data + 'T00:00:00');
                            let inicio = new Date(Diario.dados.combinacoes[Diario.dados.combinacaoAtual].bimestres[i].inicio + 'T00:00:00');
                            let fim = new Date(Diario.dados.combinacoes[Diario.dados.combinacaoAtual].bimestres[i].fim + 'T00:00:00');
                            return data >= inicio && data <= fim;
                        });
                        let total = registrosBimestre.length;
                        let completas = registrosBimestre.filter(a => a.registros.find(r => r.aluno === `${aluno.numero}. ${aluno.nome}`)?.tipo === 'C').length;
                        let incompletas = registrosBimestre.filter(a => a.registros.find(r => r.aluno === `${aluno.numero}. ${aluno.nome}`)?.tipo === 'I').length;
                        let naoFeitas = registrosBimestre.filter(a => a.registros.find(r => r.aluno === `${aluno.numero}. ${aluno.nome}`)?.tipo === 'N').length;
                        let pC = total > 0 ? Math.round((completas / total) * 100) : 0;
                        let pI = total > 0 ? Math.round((incompletas / total) * 100) : 0;
                        let pN = total > 0 ? Math.round((naoFeitas / total) * 100) : 0;
                        tabelaHTML += `
                            <td>${pC}%</td>
                            <td>${pI}%</td>
                            <td>${pN}%</td>
                        `;
                    }
                    tabelaHTML += `</tr>`;
                });
            }
            tabelaHTML += `</tbody></table>`;
            return tabelaHTML;
        },

        construirTabelaNotas(turma) {
            let notas = Diario.dados.combinacoes[Diario.dados.combinacaoAtual].notas || [];
            let tabelaHTML = `
                <h3>Notas por Bimestre</h3>
                <table>
                    <thead>
                        <tr>
                            <th>Aluno</th>
                            <th>1º Bimestre</th>
                            <th>2º Bimestre</th>
                            <th>3º Bimestre</th>
                            <th>4º Bimestre</th>
                        </tr>
                    </thead>
                    <tbody>
            `;
            turma.alunos.forEach(aluno => {
                let alunoNotas = notas.find(n => n.aluno === `${aluno.numero}. ${aluno.nome}`) || {
                    aluno: `${aluno.numero}. ${aluno.nome}`,
                    bimestres: [[null, null, null], [null, null, null], [null, null, null], [null, null, null]]
                };
                tabelaHTML += `<tr><td>${aluno.numero}. ${aluno.nome}</td>`;
                alunoNotas.bimestres.forEach(notasBimestre => {
                    let media = Diario.funcoes.calcularMediaBimestral(notasBimestre);
                    let corMedia = media === "-" ? "black" : media >= 7.0 ? "#00008B" : "red";
                    tabelaHTML += `<td><span style="color: ${corMedia};">${media}</span></td>`;
                });
                tabelaHTML += "</tr>";
            });
            tabelaHTML += "</tbody></table>";
            return tabelaHTML;
        },

        construirTabelaConteudo() {
            let conteudos = Diario.dados.combinacoes[Diario.dados.combinacaoAtual].conteudo || [];
            let tabelaHTML = `
                <h3>Conteúdos Registrados</h3>
                <table>
                    <thead>
                        <tr>
                            <th>Conteúdo Ministrado</th>
                            <th>Data</th>
                        </tr>
                    </thead>
                    <tbody>
            `;
            if (conteudos.length === 0) {
                tabelaHTML += `<tr><td colspan="2">Nenhum conteúdo registrado</td></tr>`;
            } else {
                conteudos.sort((a, b) => new Date(b.data) - new Date(a.data));
                conteudos.forEach(c => {
                    tabelaHTML += `
                        <tr>
                            <td>${c.texto}</td>
                            <td>${Diario.funcoes.formatarData(c.data)}</td>
                        </tr>
                    `;
                });
            }
            tabelaHTML += "</tbody></table>";
            return tabelaHTML;
        },

        construirTabelaResultados(turma) {
            let tabelaHTML = `
                <h3>Resultados</h3>
                <table>
                    <thead>
                        <tr>
                            <th>Aluno</th>
                            <th>Total de Faltas</th>
                            <th>Média Geral</th>
                            <th>Recuperação Final</th>
                            <th>Situação</th>
                        </tr>
                    </thead>
                    <tbody>
            `;
            let notas = Diario.dados.combinacoes[Diario.dados.combinacaoAtual].notas || [];
            let recuperacao = Diario.dados.combinacoes[Diario.dados.combinacaoAtual].recuperacao || [];
            
            turma.alunos.forEach(aluno => {
                let faltasTotais = 0;
                let faltasJustificadas = 0;
                if (Diario.dados.combinacoes[Diario.dados.combinacaoAtual].frequencia.length > 0) {
                    Diario.dados.combinacoes[Diario.dados.combinacaoAtual].frequencia.forEach(f => {
                        let registro = f.registros.find(r => r.aluno === `${aluno.numero}. ${aluno.nome}`);
                        if (registro) {
                            let valor = registro.tipo === 'F' || registro.tipo === 'J' ? 1 : registro.tipo === 'D' || registro.tipo === 'JD' ? 2 : 0;
                            faltasTotais += valor;
                            if (registro.tipo === 'J') faltasJustificadas += 1;
                            if (registro.tipo === 'JD') faltasJustificadas += 2;
                        }
                    });
                }
                let alunoNotas = notas.find(n => n.aluno === `${aluno.numero}. ${aluno.nome}`) || {
                    bimestres: [[null, null, null], [null, null, null], [null, null, null], [null, null, null]]
                };
                let mediaGeral = Diario.funcoes.calcularMediaGeral(alunoNotas.bimestres);
                let recuperacaoNota = recuperacao.find(r => r.aluno === `${aluno.numero}. ${aluno.nome}`)?.nota || null;
                let situacao = "-";
                let situacaoClasse = "";
                if (recuperacaoNota !== null) {
                    situacao = recuperacaoNota >= 7 ? "Aprovado" : "Reprovado";
                    situacaoClasse = recuperacaoNota >= 7 ? "aprovado" : "reprovado";
                } else if (mediaGeral !== "-" && mediaGeral >= 7) {
                    situacao = "Aprovado";
                    situacaoClasse = "aprovado";
                } else if (mediaGeral !== "-") {
                    situacao = "Reprovado";
                    situacaoClasse = "reprovado";
                }
                let corMedia = mediaGeral === "-" ? "black" : mediaGeral >= 7 ? "#00008B" : "red";
                let corRecuperacao = recuperacaoNota === null ? "black" : recuperacaoNota >= 7 ? "#00008B" : "red";
                
                tabelaHTML += `
                    <tr>
                        <td>${aluno.numero}. ${aluno.nome}</td>
                        <td><span style="color: red;">${faltasTotais}</span> <span style="color: blue;">(${faltasJustificadas})</span></td>
                        <td><span style="color: ${corMedia}">${mediaGeral}</span></td>
                        <td><span style="color: ${corRecuperacao}">${recuperacaoNota !== null ? recuperacaoNota : "-"}</span></td>
                        <td><span class="${situacaoClasse}">${situacao}</span></td>
                    </tr>
                `;
            });
            tabelaHTML += "</tbody></table>";
            return tabelaHTML;
        },

        mostrarResumo(tipo) {
            let abas = document.querySelectorAll('.aba');
            abas.forEach(aba => aba.classList.remove('ativa'));
            document.querySelector(`.aba[onclick="Diario.telas.mostrarResumo('${tipo}')"]`).classList.add('ativa');
            let conteudo = document.getElementById("resumo-conteudo");
            conteudo.innerHTML = "";
            conteudo.classList.remove('conteudo', 'atividades', 'resultados');
            let turmaNome = Diario.dados.combinacaoAtual.split(" - ")[1];
            let turma = Diario.dados.turmasIndependentes.find(t => t.nome === turmaNome);
            if (!turma) {
                conteudo.innerHTML = "<p>Turma não encontrada.</p>";
                return;
            }

            if (tipo === 'frequencia') {
                conteudo.innerHTML = Diario.telas.construirTabelaFrequencia(turma);
                conteudo.innerHTML += `<div id="historico-frequencia">${Diario.telas.construirTabelaHistoricoFrequencia(turma, 0)}</div>`;
            } else if (tipo === 'conteudo') {
                conteudo.classList.add('conteudo');
                conteudo.innerHTML = Diario.telas.construirTabelaConteudo();
            } else if (tipo === 'notas') {
                conteudo.innerHTML = Diario.telas.construirTabelaNotas(turma);
            } else if (tipo === 'atividades') {
                conteudo.classList.add('atividades');
                conteudo.innerHTML = Diario.telas.construirTabelaAtividades(turma);
            } else if (tipo === 'resultados') {
                conteudo.classList.add('resultados');
                conteudo.innerHTML = Diario.telas.construirTabelaResultados(turma);
            }
        },

        mostrarHistoricoFrequencia(bimestreIdx) {
            let turmaNome = Diario.dados.combinacaoAtual.split(" - ")[1];
            let turma = Diario.dados.turmasIndependentes.find(t => t.nome === turmaNome);
            let historicoDiv = document.getElementById("historico-frequencia");
            historicoDiv.innerHTML = Diario.telas.construirTabelaHistoricoFrequencia(turma, bimestreIdx);
        },

        mostrarTelaFrequencia() {
            Diario.funcoes.esconderTelas();
            document.getElementById("tela-frequencia").style.display = "block";
            document.getElementById("frequencia-titulo").innerText = `Frequência - ${Diario.dados.combinacaoAtual}`;
            let turmaNome = Diario.dados.combinacaoAtual.split(" - ")[1];
            let turma = Diario.dados.turmasIndependentes.find(t => t.nome === turmaNome);
            let lista = document.getElementById("frequencia-lista");
            lista.innerHTML = "";
            if (turma) {
                turma.alunos.forEach(aluno => {
                    lista.innerHTML += `
                        <tr>
                            <td>${aluno.numero}. ${aluno.nome}</td>
                            <td><input type="radio" name="frequencia-${aluno.numero}" value="F"></td>
                            <td><input type="radio" name="frequencia-${aluno.numero}" value="D"></td>
                            <td><input type="radio" name="frequencia-${aluno.numero}" value="P" checked></td>
                            <td><input type="radio" name="frequencia-${aluno.numero}" value="J"></td>
                            <td><input type="radio" name="frequencia-${aluno.numero}" value="JD"></td>
                        </tr>`;
                });
            }
            let select = document.getElementById("frequencia-remover-data");
            select.innerHTML = "<option value=''>Remover frequência registrada</option>";
            if (Diario.dados.combinacoes[Diario.dados.combinacaoAtual].frequencia.length > 0) {
                Diario.dados.combinacoes[Diario.dados.combinacaoAtual].frequencia.forEach(f => {
                    select.innerHTML += `<option value="${f.data}">${Diario.funcoes.formatarData(f.data)}</option>`;
                });
            }
            document.getElementById("frequencia-data").value = new Date().toISOString().split('T')[0]; // Data atual
        },

        registrarFrequencia() {
            let data = document.getElementById("frequencia-data").value;
            if (!data) {
                Diario.funcoes.mostrarNotificacao("Selecione uma data!", "erro");
                return;
            }
            let registros = [];
            let turmaNome = Diario.dados.combinacaoAtual.split(" - ")[1];
            let turma = Diario.dados.turmasIndependentes.find(t => t.nome === turmaNome);
            turma.alunos.forEach(aluno => {
                let tipo = document.querySelector(`input[name="frequencia-${aluno.numero}"]:checked`).value;
                registros.push({ aluno: `${aluno.numero}. ${aluno.nome}`, tipo: tipo });
            });
            if (Diario.dados.combinacoes[Diario.dados.combinacaoAtual].frequencia.some(f => f.data === data)) {
                if (!confirm("Data já registrada. Sobrescrever?")) return;
                Diario.dados.combinacoes[Diario.dados.combinacaoAtual].frequencia = Diario.dados.combinacoes[Diario.dados.combinacaoAtual].frequencia.filter(f => f.data !== data);
            }
            Diario.dados.combinacoes[Diario.dados.combinacaoAtual].frequencia.push({ data: data, registros: registros });
            localStorage.setItem('combinacoes', JSON.stringify(Diario.dados.combinacoes));
            Diario.telas.mostrarTelaFrequencia();
            Diario.funcoes.mostrarNotificacao("Frequência registrada com sucesso!");
        },

        removerFrequencia() {
            let data = document.getElementById("frequencia-remover-data").value;
            if (!data) {
                Diario.funcoes.mostrarNotificacao("Selecione uma data para remover!", "erro");
                return;
            }
            if (confirm(`Tem certeza que deseja remover a frequência de ${Diario.funcoes.formatarData(data)}?`)) {
                Diario.dados.combinacoes[Diario.dados.combinacaoAtual].frequencia = Diario.dados.combinacoes[Diario.dados.combinacaoAtual].frequencia.filter(f => f.data !== data);
                localStorage.setItem('combinacoes', JSON.stringify(Diario.dados.combinacoes));
                Diario.telas.mostrarTelaFrequencia();
                Diario.funcoes.mostrarNotificacao("Frequência removida com sucesso!");
            }
        },

        mostrarTelaAtividades() {
            Diario.funcoes.esconderTelas();
            document.getElementById("tela-atividades").style.display = "block";
            document.getElementById("atividades-titulo").innerText = `Atividades - ${Diario.dados.combinacaoAtual}`;
            let turmaNome = Diario.dados.combinacaoAtual.split(" - ")[1];
            let turma = Diario.dados.turmasIndependentes.find(t => t.nome === turmaNome);
            let lista = document.getElementById("atividades-lista");
            lista.innerHTML = "";
            if (turma) {
                turma.alunos.forEach(aluno => {
                    lista.innerHTML += `
                        <tr>
                            <td>${aluno.numero}. ${aluno.nome}</td>
                            <td><input type="radio" name="atividade-${aluno.numero}" value="C"></td>
                            <td><input type="radio" name="atividade-${aluno.numero}" value="I"></td>
                            <td><input type="radio" name="atividade-${aluno.numero}" value="N" checked></td>
                        </tr>`;
                });
            }
            let select = document.getElementById("atividades-editar-data");
            select.innerHTML = "<option value=''>Editar/Remover atividade registrada</option>";
            if (Diario.dados.combinacoes[Diario.dados.combinacaoAtual].atividades.length > 0) {
                Diario.dados.combinacoes[Diario.dados.combinacaoAtual].atividades.forEach(a => {
                    select.innerHTML += `<option value="${a.data}">${Diario.funcoes.formatarData(a.data)}</option>`;
                });
            }
            // Garante a data atual
            let hoje = new Date().toISOString().split('T')[0];
            document.getElementById("atividades-data").value = hoje;
        },

        registrarAtividade() {
            let data = document.getElementById("atividades-data").value;
            if (!data) {
                Diario.funcoes.mostrarNotificacao("Selecione uma data!", "erro");
                return;
            }
            let registros = [];
            let turmaNome = Diario.dados.combinacaoAtual.split(" - ")[1];
            let turma = Diario.dados.turmasIndependentes.find(t => t.nome === turmaNome);
            turma.alunos.forEach(aluno => {
                let tipo = document.querySelector(`input[name="atividade-${aluno.numero}"]:checked`).value;
                registros.push({ aluno: `${aluno.numero}. ${aluno.nome}`, tipo: tipo });
            });
            if (Diario.dados.combinacoes[Diario.dados.combinacaoAtual].atividades.some(a => a.data === data)) {
                if (!confirm("Data já registrada. Sobrescrever?")) return;
                Diario.dados.combinacoes[Diario.dados.combinacaoAtual].atividades = Diario.dados.combinacoes[Diario.dados.combinacaoAtual].atividades.filter(a => a.data !== data);
            }
            Diario.dados.combinacoes[Diario.dados.combinacaoAtual].atividades.push({ data: data, registros: registros });
            localStorage.setItem('combinacoes', JSON.stringify(Diario.dados.combinacoes));
            Diario.telas.mostrarTelaAtividades();
            Diario.funcoes.mostrarNotificacao("Atividade registrada com sucesso!");
        },

        editarAtividade() {
            let data = document.getElementById("atividades-editar-data").value;
            if (!data) {
                Diario.funcoes.mostrarNotificacao("Selecione uma data para editar!", "erro");
                return;
            }
            let novoData = document.getElementById("atividades-data").value || data;
            let registros = [];
            let turmaNome = Diario.dados.combinacaoAtual.split(" - ")[1];
            let turma = Diario.dados.turmasIndependentes.find(t => t.nome === turmaNome);
            turma.alunos.forEach(aluno => {
                let tipo = document.querySelector(`input[name="atividade-${aluno.numero}"]:checked`).value;
                registros.push({ aluno: `${aluno.numero}. ${aluno.nome}`, tipo: tipo });
            });
            if (Diario.dados.combinacoes[Diario.dados.combinacaoAtual].atividades.some(a => a.data === data)) {
                Diario.dados.combinacoes[Diario.dados.combinacaoAtual].atividades = Diario.dados.combinacoes[Diario.dados.combinacaoAtual].atividades.filter(a => a.data !== data);
                Diario.dados.combinacoes[Diario.dados.combinacaoAtual].atividades.push({ data: novoData, registros: registros });
                localStorage.setItem('combinacoes', JSON.stringify(Diario.dados.combinacoes));
                Diario.telas.mostrarTelaAtividades();
                Diario.funcoes.mostrarNotificacao("Atividade editada com sucesso!");
            } else {
                Diario.funcoes.mostrarNotificacao("Nenhuma atividade encontrada para essa data. Use 'Registrar' para adicionar.", "erro");
            }
        },

        removerAtividade() {
            let data = document.getElementById("atividades-editar-data").value;
            if (!data) {
                Diario.funcoes.mostrarNotificacao("Selecione uma data para remover!", "erro");
                return;
            }
            if (confirm(`Tem certeza que deseja remover a atividade de ${Diario.funcoes.formatarData(data)}?`)) {
                Diario.dados.combinacoes[Diario.dados.combinacaoAtual].atividades = Diario.dados.combinacoes[Diario.dados.combinacaoAtual].atividades.filter(a => a.data !== data);
                localStorage.setItem('combinacoes', JSON.stringify(Diario.dados.combinacoes));
                Diario.telas.mostrarTelaAtividades();
                Diario.funcoes.mostrarNotificacao("Atividade removida com sucesso!");
            }
        },

        mostrarTelaNotas() {
            Diario.funcoes.esconderTelas();
            document.getElementById("tela-notas").style.display = "block";
            document.getElementById("notas-titulo").innerText = `Notas - ${Diario.dados.combinacaoAtual}`;
            let turmaNome = Diario.dados.combinacaoAtual.split(" - ")[1];
            let turma = Diario.dados.turmasIndependentes.find(t => t.nome === turmaNome);
            let notas = Diario.dados.combinacoes[Diario.dados.combinacaoAtual].notas || [];
            let lista = document.getElementById("notas-lista");
            lista.innerHTML = "";

            if (turma) {
                turma.alunos.forEach(aluno => {
                    let alunoNotas = notas.find(n => n.aluno === `${aluno.numero}. ${aluno.nome}`) || {
                        aluno: `${aluno.numero}. ${aluno.nome}`,
                        bimestres: [[null, null, null], [null, null, null], [null, null, null], [null, null, null]]
                    };
                    lista.innerHTML += `
                        <tr>
                            <td>${aluno.numero}. ${aluno.nome}</td>
                            ${[0, 1, 2, 3].map(bimestre => {
                                let notasBimestre = alunoNotas.bimestres[bimestre];
                                let mediaInicial = Diario.funcoes.calcularMediaBimestral([notasBimestre[0], notasBimestre[1]]);
                                let precisaRec = mediaInicial !== "-" && mediaInicial < 7.0;
                                let mediaFinal = Diario.funcoes.calcularMediaBimestral(notasBimestre);
                                let corMedia = mediaFinal === "-" ? "black" : mediaFinal >= 7.0 ? "#00008B" : "red";
                                return `
                                    <td><input type="number" min="0" max="10" step="0.1" name="${aluno.numero}-b${bimestre}-men" value="${notasBimestre[0] || ''}" onchange="Diario.telas.calcularMedia(this)"></td>
                                    <td><input type="number" min="0" max="10" step="0.1" name="${aluno.numero}-b${bimestre}-bim" value="${notasBimestre[1] || ''}" onchange="Diario.telas.calcularMedia(this)"></td>
                                    <td><input type="number" min="0" max="10" step="0.1" name="${aluno.numero}-b${bimestre}-rp" value="${notasBimestre[2] || ''}" ${!precisaRec && !notasBimestre[2] ? 'disabled' : ''} onchange="Diario.telas.calcularMedia(this)"></td>
                                    <td id="${aluno.numero}-b${bimestre}-media"><span style="color: ${corMedia}">${mediaFinal}</span></td>
                                `;
                            }).join('')}
                        </tr>
                    `;
                });
            }
        },

        calcularMedia(input) {
            let [alunoNum, bimestre, tipo] = input.name.split('-');
            let bimestreIdx = parseInt(bimestre.slice(1));
            let aluno = `${alunoNum.split('_')[0]}. ${input.closest('tr').querySelector('td:first-child').textContent.split('. ')[1]}`;
            let notas = Diario.dados.combinacoes[Diario.dados.combinacaoAtual].notas || [];
            let alunoNotas = notas.find(n => n.aluno === aluno) || {
                aluno: aluno,
                bimestres: [[null, null, null], [null, null, null], [null, null, null], [null, null, null]]
            };

            if (!notas.includes(alunoNotas)) notas.push(alunoNotas);
            let idx = tipo === 'men' ? 0 : tipo === 'bim' ? 1 : 2;
            alunoNotas.bimestres[bimestreIdx][idx] = input.value ? parseFloat(input.value) : null;

            let mediaInicial = Diario.funcoes.calcularMediaBimestral([alunoNotas.bimestres[bimestreIdx][0], alunoNotas.bimestres[bimestreIdx][1]]);
            let precisaRec = mediaInicial !== "-" && mediaInicial < 7.0;
            let rpInput = document.querySelector(`input[name="${alunoNum}-b${bimestreIdx}-rp"]`);
            rpInput.disabled = !precisaRec && !alunoNotas.bimestres[bimestreIdx][2];

            let mediaFinal = Diario.funcoes.calcularMediaBimestral(alunoNotas.bimestres[bimestreIdx]);
            let corMedia = mediaFinal === "-" ? "black" : mediaFinal >= 7.0 ? "#00008B" : "red";
            document.getElementById(`${alunoNum.split('_')[0]}-b${bimestreIdx}-media`).innerHTML = `<span style="color: ${corMedia}">${mediaFinal}</span>`;
        },

        salvarNotas() {
            let notas = [];
            let turmaNome = Diario.dados.combinacaoAtual.split(" - ")[1];
            let turma = Diario.dados.turmasIndependentes.find(t => t.nome === turmaNome);
            turma.alunos.forEach(aluno => {
                let alunoNotas = {
                    aluno: `${aluno.numero}. ${aluno.nome}`,
                    bimestres: []
                };
                for (let i = 0; i < 4; i++) {
                    let men = document.querySelector(`input[name="${aluno.numero}-b${i}-men"]`).value;
                    let bim = document.querySelector(`input[name="${aluno.numero}-b${i}-bim"]`).value;
                    let rp = document.querySelector(`input[name="${aluno.numero}-b${i}-rp"]`).value;
                    alunoNotas.bimestres.push([
                        men ? parseFloat(men) : null,
                        bim ? parseFloat(bim) : null,
                        rp ? parseFloat(rp) : null
                    ]);
                }
                notas.push(alunoNotas);
            });
            Diario.dados.combinacoes[Diario.dados.combinacaoAtual].notas = notas;
            localStorage.setItem('combinacoes', JSON.stringify(Diario.dados.combinacoes));
            Diario.funcoes.mostrarNotificacao("Notas salvas com sucesso!");
            Diario.telas.mostrarTelaNotas();
        },

        mostrarTelaConteudo() {
            Diario.funcoes.esconderTelas();
            document.getElementById("tela-conteudo").style.display = "block";
            document.getElementById("conteudo-titulo").innerText = `Conteúdo - ${Diario.dados.combinacaoAtual}`;
            let select = document.getElementById("conteudo-editar-data");
            select.innerHTML = "<option value=''>Editar conteúdo registrado</option>";
            if (Diario.dados.combinacoes[Diario.dados.combinacaoAtual].conteudo.length > 0) {
                Diario.dados.combinacoes[Diario.dados.combinacaoAtual].conteudo.forEach(c => {
                    select.innerHTML += `<option value="${c.data}">${Diario.funcoes.formatarData(c.data)}</option>`;
                });
            }
            // Garante a data atual
            let hoje = new Date().toISOString().split('T')[0];
            document.getElementById("conteudo-data").value = hoje;
            document.getElementById("conteudo-texto").value = "";
        },

        registrarConteudo() {
            let data = document.getElementById("conteudo-data").value;
            let texto = document.getElementById("conteudo-texto").value.trim();
            if (!data || !texto) {
                Diario.funcoes.mostrarNotificacao("Selecione uma data e digite o conteúdo!", "erro");
                return;
            }
            if (Diario.dados.combinacoes[Diario.dados.combinacaoAtual].conteudo.some(c => c.data === data)) {
                if (!confirm("Data já registrada. Sobrescrever?")) return;
                Diario.dados.combinacoes[Diario.dados.combinacaoAtual].conteudo = Diario.dados.combinacoes[Diario.dados.combinacaoAtual].conteudo.filter(c => c.data !== data);
            }
            Diario.dados.combinacoes[Diario.dados.combinacaoAtual].conteudo.push({ data, texto });
            localStorage.setItem('combinacoes', JSON.stringify(Diario.dados.combinacoes));
            Diario.telas.mostrarTelaConteudo();
            Diario.funcoes.mostrarNotificacao("Conteúdo registrado com sucesso!");
        },

        carregarConteudoParaEdicao() {
            let data = document.getElementById("conteudo-editar-data").value;
            if (data) {
                let conteudo = Diario.dados.combinacoes[Diario.dados.combinacaoAtual].conteudo.find(c => c.data === data);
                if (conteudo) {
                    document.getElementById("conteudo-data").value = conteudo.data;
                    document.getElementById("conteudo-texto").value = conteudo.texto;
                }
            }
        },

        editarConteudo() {
            let data = document.getElementById("conteudo-data").value;
            let texto = document.getElementById("conteudo-texto").value.trim();
            if (!data || !texto) {
                Diario.funcoes.mostrarNotificacao("Selecione uma data e digite o conteúdo!", "erro");
                return;
            }
            if (Diario.dados.combinacoes[Diario.dados.combinacaoAtual].conteudo.some(c => c.data === data)) {
                Diario.dados.combinacoes[Diario.dados.combinacaoAtual].conteudo = Diario.dados.combinacoes[Diario.dados.combinacaoAtual].conteudo.filter(c => c.data !== data);
                Diario.dados.combinacoes[Diario.dados.combinacaoAtual].conteudo.push({ data, texto });
                localStorage.setItem('combinacoes', JSON.stringify(Diario.dados.combinacoes));
                Diario.telas.mostrarTelaConteudo();
                Diario.funcoes.mostrarNotificacao("Conteúdo editado com sucesso!");
            } else {
                Diario.funcoes.mostrarNotificacao("Nenhum conteúdo encontrado para essa data. Use 'Registrar' para adicionar.", "erro");
            }
        },

        removerConteudo() {
            let data = document.getElementById("conteudo-editar-data").value;
            if (!data) {
                Diario.funcoes.mostrarNotificacao("Selecione uma data para remover!", "erro");
                return;
            }
            if (confirm(`Tem certeza que deseja remover o conteúdo de ${Diario.funcoes.formatarData(data)}?`)) {
                Diario.dados.combinacoes[Diario.dados.combinacaoAtual].conteudo = Diario.dados.combinacoes[Diario.dados.combinacaoAtual].conteudo.filter(c => c.data !== data);
                localStorage.setItem('combinacoes', JSON.stringify(Diario.dados.combinacoes));
                Diario.telas.mostrarTelaConteudo();
                Diario.funcoes.mostrarNotificacao("Conteúdo removido com sucesso!");
            }
        },

        mostrarTelaRecuperacao() {
            Diario.funcoes.esconderTelas();
            document.getElementById("tela-recuperacao").style.display = "block";
            document.getElementById("recuperacao-titulo").innerText = `Recuperação Final - ${Diario.dados.combinacaoAtual}`;
            document.getElementById("recuperacao-conteudo").innerHTML = "";
            document.getElementById("btn-salvar-recuperacao").style.display = "none";
        },

        mostrarRecuperacaoConjugada() {
            Diario.funcoes.esconderTelas();
            document.getElementById("tela-recuperacao").style.display = "block";
            document.getElementById("recuperacao-titulo").innerText = `Recuperação Final com Paralela do 4º Bimestre - ${Diario.dados.combinacaoAtual}`;
            let turmaNome = Diario.dados.combinacaoAtual.split(" - ")[1];
            let turma = Diario.dados.turmasIndependentes.find(t => t.nome === turmaNome);
            let notas = Diario.dados.combinacoes[Diario.dados.combinacaoAtual].notas || [];
            let recuperacao = Diario.dados.combinacoes[Diario.dados.combinacaoAtual].recuperacao || [];
            let conteudo = document.getElementById("recuperacao-conteudo");
            conteudo.innerHTML = `
                <table>
                    <thead>
                        <tr>
                            <th>Aluno</th>
                            <th>Média Geral</th>
                            <th>Nota Paralela 4º Bimestre</th>
                            <th>Nota Recuperação Final</th>
                        </tr>
                    </thead>
                    <tbody id="recuperacao-lista">
            `;
            turma.alunos.forEach(aluno => {
                let alunoNotas = notas.find(n => n.aluno === `${aluno.numero}. ${aluno.nome}`) || { bimestres: [[null, null, null], [null, null, null], [null, null, null], [null, null, null]] };
                let mediaGeral = Diario.funcoes.calcularMediaGeral(alunoNotas.bimestres);
                let recuperacaoAluno = recuperacao.find(r => r.aluno === `${aluno.numero}. ${aluno.nome}`);
                let notaParalela = recuperacaoAluno?.paralela || "";
                let notaRecuperacao = recuperacaoAluno?.nota || "";
                conteudo.innerHTML += `
                    <tr>
                        <td>${aluno.numero}. ${aluno.nome}</td>
                        <td>${mediaGeral}</td>
                        <td><input type="number" min="0" max="10" step="0.5" value="${notaParalela}" data-aluno="${aluno.numero}. ${aluno.nome}" class="nota-paralela"></td>
                        <td><input type="number" min="0" max="10" step="0.5" value="${notaRecuperacao}" data-aluno="${aluno.numero}. ${aluno.nome}" class="nota-recuperacao"></td>
                    </tr>
                `;
            });
            conteudo.innerHTML += "</tbody></table>";
            document.getElementById("btn-salvar-recuperacao").style.display = "block";
        },

        mostrarRecuperacaoExclusiva() {
            Diario.funcoes.esconderTelas();
            document.getElementById("tela-recuperacao").style.display = "block";
            document.getElementById("recuperacao-titulo").innerText = `Recuperação Final Exclusiva - ${Diario.dados.combinacaoAtual}`;
            let turmaNome = Diario.dados.combinacaoAtual.split(" - ")[1];
            let turma = Diario.dados.turmasIndependentes.find(t => t.nome === turmaNome);
            let notas = Diario.dados.combinacoes[Diario.dados.combinacaoAtual].notas || [];
            let recuperacao = Diario.dados.combinacoes[Diario.dados.combinacaoAtual].recuperacao || [];
            let conteudo = document.getElementById("recuperacao-conteudo");
            conteudo.innerHTML = `
                <table>
                    <thead>
                        <tr>
                            <th>Aluno</th>
                            <th>Média Geral</th>
                            <th>Nota Recuperação Final</th>
                        </tr>
                    </thead>
                    <tbody id="recuperacao-lista">
            `;
            turma.alunos.forEach(aluno => {
                let alunoNotas = notas.find(n => n.aluno === `${aluno.numero}. ${aluno.nome}`) || { bimestres: [[null, null, null], [null, null, null], [null, null, null], [null, null, null]] };
                let mediaGeral = Diario.funcoes.calcularMediaGeral(alunoNotas.bimestres);
                let recuperacaoAluno = recuperacao.find(r => r.aluno === `${aluno.numero}. ${aluno.nome}`);
                let notaRecuperacao = recuperacaoAluno?.nota || "";
                conteudo.innerHTML += `
                    <tr>
                        <td>${aluno.numero}. ${aluno.nome}</td>
                        <td>${mediaGeral}</td>
                        <td><input type="number" min="0" max="10" step="0.5" value="${notaRecuperacao}" data-aluno="${aluno.numero}. ${aluno.nome}" class="nota-recuperacao"></td>
                    </tr>
                `;
            });
            conteudo.innerHTML += "</tbody></table>";
            document.getElementById("btn-salvar-recuperacao").style.display = "block";
        },

        salvarRecuperacao() {
            let inputsParalela = document.querySelectorAll(".nota-paralela");
            let inputsRecuperacao = document.querySelectorAll(".nota-recuperacao");
            let recuperacao = [];
            inputsRecuperacao.forEach(input => {
                let aluno = input.getAttribute("data-aluno");
                let nota = input.value ? parseFloat(input.value) : null;
                let paralela = null;
                if (inputsParalela.length > 0) {
                    let inputParalela = Array.from(inputsParalela).find(i => i.getAttribute("data-aluno") === aluno);
                    paralela = inputParalela && inputParalela.value ? parseFloat(inputParalela.value) : null;
                }
                if (nota !== null || paralela !== null) {
                    recuperacao.push({ aluno: aluno, nota: nota, paralela: paralela });
                }
            });
            Diario.dados.combinacoes[Diario.dados.combinacaoAtual].recuperacao = recuperacao;
            localStorage.setItem('combinacoes', JSON.stringify(Diario.dados.combinacoes));
            Diario.telas.voltarCombinacao();
            Diario.funcoes.mostrarNotificacao("Recuperação salva com sucesso!");
        },

        registrarFrequencia() {
            let data = document.getElementById("frequencia-data").value;
            if (!data) {
                Diario.funcoes.mostrarNotificacao("Selecione uma data!", "erro");
                return;
            }
            let registros = [];
            let turmaNome = Diario.dados.combinacaoAtual.split(" - ")[1];
            let turma = Diario.dados.turmasIndependentes.find(t => t.nome === turmaNome);
            turma.alunos.forEach(aluno => {
                let tipo = document.querySelector(`input[name="frequencia-${aluno.numero}"]:checked`).value;
                registros.push({ aluno: `${aluno.numero}. ${aluno.nome}`, tipo: tipo });
            });
            if (Diario.dados.combinacoes[Diario.dados.combinacaoAtual].frequencia.some(f => f.data === data)) {
                if (!confirm("Data já registrada. Sobrescrever?")) return;
                Diario.dados.combinacoes[Diario.dados.combinacaoAtual].frequencia = Diario.dados.combinacoes[Diario.dados.combinacaoAtual].frequencia.filter(f => f.data !== data);
            }
            Diario.dados.combinacoes[Diario.dados.combinacaoAtual].frequencia.push({ data: data, registros: registros });
            localStorage.setItem('combinacoes', JSON.stringify(Diario.dados.combinacoes));
            Diario.telas.mostrarTelaFrequencia();
            Diario.funcoes.mostrarNotificacao("Frequência registrada com sucesso!");
        },

        removerFrequencia() {
            let data = document.getElementById("frequencia-remover-data").value;
            if (!data) {
                Diario.funcoes.mostrarNotificacao("Selecione uma data para remover!", "erro");
                return;
            }
            if (confirm(`Remover frequência de ${Diario.funcoes.formatarData(data)}?`)) {
                Diario.dados.combinacoes[Diario.dados.combinacaoAtual].frequencia = Diario.dados.combinacoes[Diario.dados.combinacaoAtual].frequencia.filter(f => f.data !== data);
                localStorage.setItem('combinacoes', JSON.stringify(Diario.dados.combinacoes));
                Diario.telas.mostrarTelaFrequencia();
                Diario.funcoes.mostrarNotificacao("Frequência removida com sucesso!");
            }
        },

        mostrarTelaNotas() {
            Diario.funcoes.esconderTelas();
            document.getElementById("tela-notas").style.display = "block";
            document.getElementById("notas-titulo").innerText = `Notas - ${Diario.dados.combinacaoAtual}`;
            let turmaNome = Diario.dados.combinacaoAtual.split(" - ")[1];
            let turma = Diario.dados.turmasIndependentes.find(t => t.nome === turmaNome);
            let notas = Diario.dados.combinacoes[Diario.dados.combinacaoAtual].notas || [];
            let lista = document.getElementById("notas-lista");
            lista.innerHTML = "";
            turma.alunos.forEach(aluno => {
                let alunoNotas = notas.find(n => n.aluno === `${aluno.numero}. ${aluno.nome}`) || { bimestres: [[null, null, null], [null, null, null], [null, null, null], [null, null, null]] };
                lista.innerHTML += `
                    <tr>
                        <td>${aluno.numero}. ${aluno.nome}</td>
                        ${alunoNotas.bimestres.map((bimestre, bimestreIdx) => `
                            <td><input type="number" min="0" max="10" step="0.5" value="${bimestre[0] || ''}" data-aluno="${aluno.numero}. ${aluno.nome}" data-bimestre="${bimestreIdx}" data-tipo="mensal"></td>
                            <td><input type="number" min="0" max="10" step="0.5" value="${bimestre[1] || ''}" data-aluno="${aluno.numero}. ${aluno.nome}" data-bimestre="${bimestreIdx}" data-tipo="bimestral"></td>
                            <td><input type="number" min="0" max="10" step="0.5" value="${bimestre[2] || ''}" data-aluno="${aluno.numero}. ${aluno.nome}" data-bimestre="${bimestreIdx}" data-tipo="recuperacao"></td>
                            <td><input type="number" value="${Diario.funcoes.calcularMediaBimestral(bimestre)}" disabled></td>
                        `).join('')}
                    </tr>
                `;
            });
        },

        salvarNotas() {
            let inputs = document.querySelectorAll("#notas-lista input:not(:disabled)");
            let notas = [];
            let turmaNome = Diario.dados.combinacaoAtual.split(" - ")[1];
            let turma = Diario.dados.turmasIndependentes.find(t => t.nome === turmaNome);
            turma.alunos.forEach(aluno => {
                let alunoNotas = { aluno: `${aluno.numero}. ${aluno.nome}`, bimestres: [[null, null, null], [null, null, null], [null, null, null], [null, null, null]] };
                inputs.forEach(input => {
                    if (input.getAttribute("data-aluno") === alunoNotas.aluno) {
                        let bimestreIdx = parseInt(input.getAttribute("data-bimestre"));
                        let tipo = input.getAttribute("data-tipo");
                        let valor = input.value ? parseFloat(input.value) : null;
                        if (tipo === "mensal") alunoNotas.bimestres[bimestreIdx][0] = valor;
                        else if (tipo === "bimestral") alunoNotas.bimestres[bimestreIdx][1] = valor;
                        else if (tipo === "recuperacao") alunoNotas.bimestres[bimestreIdx][2] = valor;
                    }
                });
                notas.push(alunoNotas);
            });
            Diario.dados.combinacoes[Diario.dados.combinacaoAtual].notas = notas;
            localStorage.setItem('combinacoes', JSON.stringify(Diario.dados.combinacoes));
            Diario.telas.mostrarTelaNotas();
            Diario.funcoes.mostrarNotificacao("Notas salvas com sucesso!");
        },

        mostrarTelaConteudo() {
            Diario.funcoes.esconderTelas();
            document.getElementById("tela-conteudo").style.display = "block";
            document.getElementById("conteudo-titulo").innerText = `Conteúdo - ${Diario.dados.combinacaoAtual}`;
            let select = document.getElementById("conteudo-editar-data");
            select.innerHTML = "<option value=''>Editar conteúdo registrado</option>";
            if (Diario.dados.combinacoes[Diario.dados.combinacaoAtual].conteudo.length > 0) {
                Diario.dados.combinacoes[Diario.dados.combinacaoAtual].conteudo.forEach(c => {
                    select.innerHTML += `<option value="${c.data}">${Diario.funcoes.formatarData(c.data)}</option>`;
                });
            }
            document.getElementById("conteudo-data").value = "";
            document.getElementById("conteudo-texto").value = "";
        },

        registrarConteudo() {
            let data = document.getElementById("conteudo-data").value;
            let texto = document.getElementById("conteudo-texto").value.trim();
            if (!data || !texto) {
                Diario.funcoes.mostrarNotificacao("Preencha a data e o conteúdo!", "erro");
                return;
            }
            if (Diario.dados.combinacoes[Diario.dados.combinacaoAtual].conteudo.some(c => c.data === data)) {
                if (!confirm("Data já registrada. Sobrescrever?")) return;
                Diario.dados.combinacoes[Diario.dados.combinacaoAtual].conteudo = Diario.dados.combinacoes[Diario.dados.combinacaoAtual].conteudo.filter(c => c.data !== data);
            }
            Diario.dados.combinacoes[Diario.dados.combinacaoAtual].conteudo.push({ data: data, texto: texto });
            localStorage.setItem('combinacoes', JSON.stringify(Diario.dados.combinacoes));
            Diario.telas.mostrarTelaConteudo();
            Diario.funcoes.mostrarNotificacao("Conteúdo registrado com sucesso!");
        },

        carregarConteudoParaEdicao() {
            let data = document.getElementById("conteudo-editar-data").value;
            if (data) {
                let conteudo = Diario.dados.combinacoes[Diario.dados.combinacaoAtual].conteudo.find(c => c.data === data);
                if (conteudo) {
                    document.getElementById("conteudo-data").value = conteudo.data;
                    document.getElementById("conteudo-texto").value = conteudo.texto;
                }
            } else {
                document.getElementById("conteudo-data").value = "";
                document.getElementById("conteudo-texto").value = "";
            }
        },

        editarConteudo() {
            let data = document.getElementById("conteudo-editar-data").value;
            let novoData = document.getElementById("conteudo-data").value;
            let novoTexto = document.getElementById("conteudo-texto").value.trim();
            if (!data || !novoData || !novoTexto) {
                Diario.funcoes.mostrarNotificacao("Selecione um conteúdo e preencha os novos dados!", "erro");
                return;
            }
            Diario.dados.combinacoes[Diario.dados.combinacaoAtual].conteudo = Diario.dados.combinacoes[Diario.dados.combinacaoAtual].conteudo.filter(c => c.data !== data);
            if (Diario.dados.combinacoes[Diario.dados.combinacaoAtual].conteudo.some(c => c.data === novoData) && novoData !== data) {
                if (!confirm("Nova data já registrada. Sobrescrever?")) return;
                Diario.dados.combinacoes[Diario.dados.combinacaoAtual].conteudo = Diario.dados.combinacoes[Diario.dados.combinacaoAtual].conteudo.filter(c => c.data !== novoData);
            }
            Diario.dados.combinacoes[Diario.dados.combinacaoAtual].conteudo.push({ data: novoData, texto: novoTexto });
            localStorage.setItem('combinacoes', JSON.stringify(Diario.dados.combinacoes));
            Diario.telas.mostrarTelaConteudo();
            Diario.funcoes.mostrarNotificacao("Conteúdo editado com sucesso!");
        },

        removerConteudo() {
            let data = document.getElementById("conteudo-editar-data").value;
            if (!data) {
                Diario.funcoes.mostrarNotificacao("Selecione um conteúdo para remover!", "erro");
                return;
            }
            if (confirm(`Remover conteúdo de ${Diario.funcoes.formatarData(data)}?`)) {
                Diario.dados.combinacoes[Diario.dados.combinacaoAtual].conteudo = Diario.dados.combinacoes[Diario.dados.combinacaoAtual].conteudo.filter(c => c.data !== data);
                localStorage.setItem('combinacoes', JSON.stringify(Diario.dados.combinacoes));
                Diario.telas.mostrarTelaConteudo();
                Diario.funcoes.mostrarNotificacao("Conteúdo removido com sucesso!");
            }
        },

        mostrarTelaAtividades() {
            Diario.funcoes.esconderTelas();
            document.getElementById("tela-atividades").style.display = "block";
            document.getElementById("atividades-titulo").innerText = `Atividades - ${Diario.dados.combinacaoAtual}`;
            let turmaNome = Diario.dados.combinacaoAtual.split(" - ")[1];
            let turma = Diario.dados.turmasIndependentes.find(t => t.nome === turmaNome);
            let lista = document.getElementById("atividades-lista");
            lista.innerHTML = "";
            if (turma) {
                turma.alunos.forEach(aluno => {
                    lista.innerHTML += `
                        <tr>
                            <td>${aluno.numero}. ${aluno.nome}</td>
                            <td><input type="radio" name="atividade-${aluno.numero}" value="C"></td>
                            <td><input type="radio" name="atividade-${aluno.numero}" value="I"></td>
                            <td><input type="radio" name="atividade-${aluno.numero}" value="N" checked></td>
                        </tr>`;
                });
            }
            let select = document.getElementById("atividades-editar-data");
            select.innerHTML = "<option value=''>Editar/Remover atividade registrada</option>";
            if (Diario.dados.combinacoes[Diario.dados.combinacaoAtual].atividades.length > 0) {
                Diario.dados.combinacoes[Diario.dados.combinacaoAtual].atividades.forEach(a => {
                    select.innerHTML += `<option value="${a.data}">${Diario.funcoes.formatarData(a.data)}</option>`;
                });
            }
        },

        registrarAtividade() {
            let data = document.getElementById("atividades-data").value;
            if (!data) {
                Diario.funcoes.mostrarNotificacao("Selecione uma data!", "erro");
                return;
            }
            let registros = [];
            let turmaNome = Diario.dados.combinacaoAtual.split(" - ")[1];
            let turma = Diario.dados.turmasIndependentes.find(t => t.nome === turmaNome);
            turma.alunos.forEach(aluno => {
                let tipo = document.querySelector(`input[name="atividade-${aluno.numero}"]:checked`).value;
                registros.push({ aluno: `${aluno.numero}. ${aluno.nome}`, tipo: tipo });
            });
            if (Diario.dados.combinacoes[Diario.dados.combinacaoAtual].atividades.some(a => a.data === data)) {
                if (!confirm("Data já registrada. Sobrescrever?")) return;
                Diario.dados.combinacoes[Diario.dados.combinacaoAtual].atividades = Diario.dados.combinacoes[Diario.dados.combinacaoAtual].atividades.filter(a => a.data !== data);
            }
            Diario.dados.combinacoes[Diario.dados.combinacaoAtual].atividades.push({ data: data, registros: registros });
            localStorage.setItem('combinacoes', JSON.stringify(Diario.dados.combinacoes));
            Diario.telas.mostrarTelaAtividades();
            Diario.funcoes.mostrarNotificacao("Atividade registrada com sucesso!");
        },

        editarAtividade() {
            let data = document.getElementById("atividades-editar-data").value;
            if (!data) {
                Diario.funcoes.mostrarNotificacao("Selecione uma atividade para editar!", "erro");
                return;
            }
            let atividade = Diario.dados.combinacoes[Diario.dados.combinacaoAtual].atividades.find(a => a.data === data);
            if (atividade) {
                let turmaNome = Diario.dados.combinacaoAtual.split(" - ")[1];
                let turma = Diario.dados.turmasIndependentes.find(t => t.nome === turmaNome);
                let lista = document.getElementById("atividades-lista");
                lista.innerHTML = "";
                turma.alunos.forEach(aluno => {
                    let registro = atividade.registros.find(r => r.aluno === `${aluno.numero}. ${aluno.nome}`);
                    let checkedC = registro && registro.tipo === "C" ? "checked" : "";
                    let checkedI = registro && registro.tipo === "I" ? "checked" : "";
                    let checkedN = (!registro || registro.tipo === "N") ? "checked" : "";
                    lista.innerHTML += `
                        <tr>
                            <td>${aluno.numero}. ${aluno.nome}</td>
                            <td><input type="radio" name="atividade-${aluno.numero}" value="C" ${checkedC}></td>
                            <td><input type="radio" name="atividade-${aluno.numero}" value="I" ${checkedI}></td>
                            <td><input type="radio" name="atividade-${aluno.numero}" value="N" ${checkedN}></td>
                        </tr>`;
                });
                document.getElementById("atividades-data").value = data;
                if (confirm("Salvar alterações?")) {
                    let registros = [];
                    turma.alunos.forEach(aluno => {
                        let tipo = document.querySelector(`input[name="atividade-${aluno.numero}"]:checked`).value;
                        registros.push({ aluno: `${aluno.numero}. ${aluno.nome}`, tipo: tipo });
                    });
                    Diario.dados.combinacoes[Diario.dados.combinacaoAtual].atividades = Diario.dados.combinacoes[Diario.dados.combinacaoAtual].atividades.filter(a => a.data !== data);
                    Diario.dados.combinacoes[Diario.dados.combinacaoAtual].atividades.push({ data: data, registros: registros });
                    localStorage.setItem('combinacoes', JSON.stringify(Diario.dados.combinacoes));
                    Diario.telas.mostrarTelaAtividades();
                    Diario.funcoes.mostrarNotificacao("Atividade editada com sucesso!");
                }
            }
        },

        removerAtividade() {
            let data = document.getElementById("atividades-editar-data").value;
            if (!data) {
                Diario.funcoes.mostrarNotificacao("Selecione uma atividade para remover!", "erro");
                return;
            }
            if (confirm(`Remover atividade de ${Diario.funcoes.formatarData(data)}?`)) {
                Diario.dados.combinacoes[Diario.dados.combinacaoAtual].atividades = Diario.dados.combinacoes[Diario.dados.combinacaoAtual].atividades.filter(a => a.data !== data);
                localStorage.setItem('combinacoes', JSON.stringify(Diario.dados.combinacoes));
                Diario.telas.mostrarTelaAtividades();
                Diario.funcoes.mostrarNotificacao("Atividade removida com sucesso!");
            }
        },

        limparDados() {
            if (confirm("Tem certeza que deseja limpar todos os dados? Isso não pode ser desfeito!")) {
                localStorage.clear();
                Diario.dados.escola = null;
                Diario.dados.disciplinas = [];
                Diario.dados.turmasIndependentes = [];
                Diario.dados.combinacoes = {};
                Diario.dados.combinacaoAtual = null;
                Diario.dados.turmaAtual = null;
                Diario.dados.disciplinaAtual = null;
                Diario.funcoes.esconderTelas();
                document.getElementById("config-inicial").style.display = "block";
                document.getElementById("nome-escola").value = "";
                document.getElementById("curso").value = "";
                document.getElementById("ano-letivo").value = "";
                document.getElementById("nome-professor").value = "";
                Diario.funcoes.mostrarNotificacao("Todos os dados foram limpos!");
                // Remove o botão "Limpar Dados" pra evitar duplicatas ao reabrir a tela de edição
                let btnLimpar = document.getElementById("btn-limpar-dados");
                if (btnLimpar) btnLimpar.remove();
            }
        },

        exportarDados() {
            let dados = {
                escola: Diario.dados.escola,
                disciplinas: Diario.dados.disciplinas,
                turmasIndependentes: Diario.dados.turmasIndependentes,
                combinacoes: Diario.dados.combinacoes
            };
            let json = JSON.stringify(dados, null, 2);
            let blob = new Blob([json], { type: "application/json" });
            let url = URL.createObjectURL(blob);
            let a = document.createElement("a");
            a.href = url;
            a.download = `diario_de_classe_${new Date().toISOString().split('T')[0]}.json`;
            a.click();
            URL.revokeObjectURL(url);
            Diario.funcoes.mostrarNotificacao("Backup exportado com sucesso!");
        },

        abrirImportacao() {
            document.getElementById("importar-dados").click();
        },

        importarDados(event) {
            let file = event.target.files[0];
            if (!file) return;
            let reader = new FileReader();
            reader.onload = function(e) {
                try {
                    let dados = JSON.parse(e.target.result);
                    if (dados.escola) {
                        Diario.dados.escola = dados.escola;
                        localStorage.setItem('escola', JSON.stringify(dados.escola));
                    }
                    if (dados.disciplinas) {
                        Diario.dados.disciplinas = dados.disciplinas;
                        localStorage.setItem('disciplinas', JSON.stringify(dados.disciplinas));
                    }
                    if (dados.turmasIndependentes) {
                        Diario.dados.turmasIndependentes = dados.turmasIndependentes;
                        localStorage.setItem('turmasIndependentes', JSON.stringify(dados.turmasIndependentes));
                    }
                    if (dados.combinacoes) {
                        Diario.dados.combinacoes = dados.combinacoes;
                        localStorage.setItem('combinacoes', JSON.stringify(dados.combinacoes));
                    }
                    Diario.telas.carregarCapa();
                    Diario.funcoes.mostrarNotificacao("Dados importados com sucesso!");
                } catch (error) {
                    Diario.funcoes.mostrarNotificacao("Erro ao importar dados: " + error.message, "erro");
                }
            };
            reader.readAsText(file);
        },

        voltarCapa() {
            Diario.telas.carregarCapa();
        },

        voltarTurmas() {
            Diario.telas.mostrarTurmasIndependentes();
        },

        voltarGerenciarAulas() {
            Diario.telas.mostrarGerenciarAulas();
        },

        voltarCombinacao() {
            Diario.telas.mostrarCombinacao(Diario.dados.combinacaoAtual);
        }
    }
};

// Inicialização
if (!Diario.dados.escola) {
    Diario.funcoes.esconderTelas();
    document.getElementById("config-inicial").style.display = "block";
    document.getElementById("nome-escola").value = "";
    document.getElementById("curso").value = "";
    document.getElementById("ano-letivo").value = "";
    document.getElementById("nome-professor").value = "";
} else {
    Diario.telas.carregarCapa();
}

// Controle do menu hambúrguer
document.getElementById("menu-btn").addEventListener("click", () => {
    document.getElementById("sidebar").classList.toggle("ativa");
});