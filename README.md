# Livro-Caixa — Controle Financeiro

App para controlar rendimentos, despesas fixas e variáveis mês a mês, com saldo automático (positivo/negativo), categorias, gráficos e resumo geral. Já vem com os dados da sua planilha importados.

Não precisa de instalação, servidor ou banco de dados: é um site estático (HTML/CSS/JS puro) que roda direto no navegador, sem depender de nenhuma biblioteca externa — os gráficos são desenhados pelo próprio app, então funcionam mesmo com bloqueador de anúncios ou economia de dados ligados. Os dados ficam salvos no `localStorage` do próprio navegador do seu computador/celular.

## Como usar

**Este mês** (tela principal)
- Use as setas ‹ › ou toque no nome do mês para navegar/pular entre os meses.
- Toque num valor para editar. Toque no nome de um item para renomear.
- As setinhas ▲▼ ao lado de cada item movem ele para cima/baixo dentro da categoria.
- A bolinha colorida antes do nome de uma despesa é a categoria dela (Moradia, Transporte, Alimentação, etc.) — toque nela para trocar.
- **+ adicionar item** cria uma linha nova. O **✕** remove (com confirmação).
- **+ Mês novo (vazio)** cria um mês em branco (despesas fixas são copiadas do mês anterior). **⧉ Duplicar mês atual** copia tudo do mês aberto (rendimentos, fixas e variáveis) para um mês novo — útil quando um mês se repete quase igual.

**Visão geral** — todos os meses lado a lado, como numa planilha, para comparar o histórico inteiro (aqui dá pra renomear/excluir meses também).

**Gráficos e resumos** (aparecem nas duas visões)
- Saldo por mês e Rendimentos × Despesas.
- Despesas por categoria do mês selecionado.
- Resumo geral: total do período, saldo total e média mensal.

**Backup** — **Exportar backup** baixa um arquivo `.json` com todos os seus dados; faça isso de vez em quando, porque os dados vivem só no navegador onde você os preencheu (não são sincronizados entre dispositivos). **Importar backup** carrega esse arquivo de volta.

## Como publicar no GitHub (grátis, com link próprio)

1. Crie um repositório novo no GitHub (pode ser público ou privado).
2. Envie estes três arquivos (`index.html`, `style.css`, `app.js`) e este `README.md` para a raiz do repositório.
   - Pelo site do GitHub: abra o repositório → **Add file → Upload files** → arraste os arquivos → **Commit changes**.
3. Vá em **Settings → Pages**.
4. Em **Source**, selecione a branch `main` e a pasta `/ (root)` → **Save**.
5. Aguarde 1-2 minutos. O GitHub mostrará o link do site (algo como `https://seu-usuario.github.io/nome-do-repositorio/`).

Pronto — esse link abre o app em qualquer navegador, e você pode salvá-lo na tela inicial do celular como um atalho.

## Limitações para saber de antemão

- Os dados não são compartilhados entre dispositivos/navegadores automaticamente (não há login nem servidor). Use o backup para levar os dados de um lugar para outro.
- Se limpar os dados de navegação do navegador ("limpar cache e cookies"), os dados salvos aqui também somem — exporte um backup antes.
