# BioPlanner — Planner de Estudos para Biomedicina

Aplicação web **100% client-side** (HTML + CSS + JavaScript puro), sem build, sem servidor e sem dependências externas. Funciona **offline** abrindo o `index.html` e publica no **GitHub Pages / Netlify / Vercel** sem configuração.

## Funcionalidades

| Módulo | O que faz |
|---|---|
| **Painel** | Resumo do dia, "Painel de disciplinas" com progresso, próximos prazos, aulas de hoje e revisões pendentes |
| **Disciplinas** | Ficha da matéria (professor, e-mail, carga horária, critérios, links) e ementa em tópicos agrupados por unidade com checklist |
| **Cronograma semanal** | Grade Seg–Sáb com aulas, laboratórios e blocos de estudo |
| **Tarefas & prazos** | Tarefas, trabalhos, relatórios de laboratório, seminários e provas, com filtros e destaque de atrasos |
| **Estudos (Kanban)** | Tópicos em *A fazer / Estudando / Concluído* (arrastar e soltar ou botões) + **revisões espaçadas** de 24h, 7 e 30 dias |
| **Notas & Faltas** | Avaliações com peso, média ponderada, projeção de quanto falta para passar/exame e controle de faltas em horas-aula |
| **Horas** | Atividades complementares e estágio, com metas |
| **Bem-estar** | Rastreador de hábitos semanal + feedback da semana |
| **Pomodoro** | Timer 25/5 sempre visível na barra lateral |
| **Dados** | Backup/restauração em JSON, exemplo de Biomedicina, regras de aprovação configuráveis |

## Como rodar localmente

1. Extraia o `.zip`.
2. Dê dois cliques em `index.html` (Chrome, Edge, Firefox ou Safari).

Opcional, com servidor local: `python3 -m http.server 8080` e acesse <http://localhost:8080>.

> Os scripts são clássicos (sem `import`/módulos ES) de propósito: módulos ES são bloqueados pelo navegador em `file://`.

## Deploy gratuito

### GitHub Pages
1. Crie um repositório no GitHub (ex.: `bioplanner`) e envie os arquivos na raiz:
   ```bash
   git init && git add . && git commit -m "BioPlanner"
   git branch -M main
   git remote add origin https://github.com/SEU_USUARIO/bioplanner.git
   git push -u origin main
   ```
2. Em **Settings → Pages**, em *Build and deployment*, escolha **Deploy from a branch**, branch `main`, pasta `/ (root)`.
3. Aguarde ~1 minuto: o site fica em `https://SEU_USUARIO.github.io/bioplanner/`.

O arquivo `.nojekyll` já está incluído e os caminhos são relativos, então funciona em subpastas.

### Netlify
Acesse <https://app.netlify.com/drop> e arraste a pasta do projeto. Ou: *Add new site → Import from Git*, sem comando de build e *publish directory* `.`.

### Vercel
`npm i -g vercel` e rode `vercel` na pasta (framework: **Other**, sem build, output `.`). Ou importe o repositório pelo painel da Vercel.

## Arquitetura

```
bioplanner/
├── index.html
├── assets/favicon.svg
├── css/
│   ├── tokens.css        # paleta e variáveis (design tokens)
│   ├── base.css          # reset, layout, navegação
│   └── components.css    # botões, cards, kanban, cronograma, modal…
└── js/
    ├── core/             # sem DOM
    │   ├── utils.js      # datas, escape de HTML, formatação
    │   ├── models.js     # entidades, dados de exemplo e regras (médias, faltas, revisões)
    │   ├── storage.js    # persistência (LocalStorage) + validação/migração
    │   └── store.js      # estado único, assinaturas e ações de domínio
    ├── ui/
    │   ├── ui.js         # modal, formulário genérico, toast, chips, barras
    │   ├── forms.js      # formulários de cada entidade
    │   └── pomodoro.js
    ├── views/            # uma tela por arquivo
    └── app.js            # roteador por hash + delegação de eventos
```

**Fluxo de dados:** a UI dispara ações → `Store.mutate` altera o estado, persiste (debounce de 150 ms) e notifica → `app.js` re-renderiza a tela atual. Toda string do usuário passa por `U.esc` antes de entrar no HTML, e links só aceitam `http(s)`.

### Persistência e banco de dados externo
Para um único usuário, **LocalStorage é suficiente**: o volume é de poucos KB, a escrita é síncrona e funciona offline e no GitHub Pages sem backend. `IndexedDB` só valeria com anexos/PDFs. **SQLite/Supabase/Firebase** compensam apenas se você precisar de **sincronização entre dispositivos** ou login; nesse caso, reimplemente `Storage.load/save` (interface única em `js/core/storage.js`) — o restante do app não muda. Enquanto isso, use **Dados → Exportar backup** regularmente (limpar dados do navegador apaga o LocalStorage).

## Design system
Paleta: `#FEFAE0` (fundo), `#E5989B` (progresso/contraste), `#FFB4A2` (aulas/suave), `#FFC2D1` (destaques) e `#000000` (texto e contornos). Hierarquia por contorno preto e preenchimentos; estados (atrasado, limite de faltas) nunca dependem só de cor — também usam texto e peso visual. Respeita `prefers-reduced-motion`, tem foco visível, *skip link* e funciona no celular.

## Personalização rápida
- **Regras da universidade** (média de aprovação, exame, limite de faltas, metas de horas): *Notas & Faltas → Regras da universidade*.
- **Cores**: edite `css/tokens.css`.
- **Horário visível do cronograma**: `START_H` / `END_H` em `js/views/cronograma.js`.

## Limitações conhecidas
- Blocos do cronograma que se sobrepõem no mesmo horário ficam empilhados (sem divisão lateral).
- Dados ficam por navegador/dispositivo; use o backup JSON para migrar.
