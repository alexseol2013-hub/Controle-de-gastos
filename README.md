# Livro-Caixa — Controle Financeiro

App para controlar rendimentos, despesas fixas e variáveis mês a mês, com saldo automático (positivo/negativo), categorias, gráficos e resumo geral. Já vem com os dados da sua planilha importados.

Não precisa de instalação, servidor ou banco de dados: é um site estático (HTML/CSS/JS puro) que roda direto no navegador, sem depender de nenhuma biblioteca externa — os gráficos são desenhados pelo próprio app, então funcionam mesmo com bloqueador de anúncios ou economia de dados ligados. Os dados ficam salvos no `localStorage` do próprio navegador do seu computador/celular.

## Como usar

**Este mês** (tela principal)
- Use as setas ‹ › ou toque no nome do mês para navegar/pular entre os meses. O lápis ✎ ao lado renomeia o mês aberto.
- Toque num valor para editar. Toque no nome de um item para renomear.
- As setinhas ▲▼ ao lado de cada item movem ele para cima/baixo dentro da categoria.
- A bolinha colorida antes do nome de uma despesa é a categoria dela (Moradia, Transporte, Alimentação, etc.) — toque nela para trocar. O app já tenta adivinhar a categoria certa pelo nome do item.
- O círculo antes do nome de uma despesa marca **pago/pendente** — toque pra alternar. Item pago fica riscado. Esse status é por mês (não carrega pro mês seguinte).
- **Saldo inicial**, no topo de Rendimentos, é automático: puxa sozinho o saldo real que sobrou do mês anterior. Só é editável no primeiro mês da sua planilha (o ponto de partida) — dos demais em diante, é só leitura (🔒), sem risco de digitar errado.
- **+ adicionar item** cria uma linha nova. O **✕** remove (com confirmação).
- **+ Mês novo (vazio)** cria um mês em branco (nome sugerido automaticamente, despesas fixas copiadas do mês anterior). **⧉ Duplicar mês atual** copia rendimentos e despesas fixas do mês aberto, já sugerindo o nome do mês seguinte (ex.: de Maio pula pra Junho) — despesas variáveis vêm em branco de propósito, pra não arrastar fatura de cartão ou compra parcelada que já acabou.

**Visão geral** — todos os meses lado a lado, como numa planilha, para comparar o histórico inteiro (aqui dá pra renomear/excluir meses e ver o Saldo inicial de cada um).

**Gráficos e resumos** (aparecem nas duas visões)
- Saldo por mês e Rendimentos × Despesas.
- Despesas por categoria do mês selecionado — agora com categorização automática, então pouca coisa cai em "Outros".
- Resumo geral: rendimentos novos do período, despesas, saldo atual e média mensal gerada.

**Backup** — **Exportar backup** baixa um arquivo `.json` com todos os seus dados. **Importar backup** carrega esse arquivo de volta. Como não existe servidor nesse app, não rolou implementar sincronização automática de verdade — mas um aviso aparece sozinho a cada poucos dias lembrando de exportar, pra reduzir o risco de perder tudo se limpar o navegador.

## Como publicar no GitHub (grátis, com link próprio)

1. Crie um repositório novo no GitHub (pode ser público ou privado).
2. Envie estes três arquivos (`index.html`, `style.css`, `app.js`) e este `README.md` para a raiz do repositório.
   - Pelo site do GitHub: abra o repositório → **Add file → Upload files** → arraste os arquivos → **Commit changes**.
3. Vá em **Settings → Pages**.
4. Em **Source**, selecione a branch `main` e a pasta `/ (root)` → **Save**.
5. Aguarde 1-2 minutos. O GitHub mostrará o link do site (algo como `https://seu-usuario.github.io/nome-do-repositorio/`).

Pronto — esse link abre o app em qualquer navegador, e você pode salvá-lo na tela inicial do celular como um atalho.

## Limitações para saber de antemão

- Os dados não são compartilhados entre dispositivos/navegadores automaticamente (não há login nem servidor). Use o backup para levar os dados de um lugar para outro. Um lembrete automático aparece no app a cada poucos dias sugerindo exportar — mas não existe sincronização em nuvem de verdade sem adicionar um serviço externo (isso mudaria o app de "site estático" pra algo com backend, contas de usuário etc.).
- Se limpar os dados de navegação do navegador ("limpar cache e cookies"), os dados salvos aqui também somem — exporte um backup antes.
- O status de pago/pendente e a categoria de cada item ficam salvos, mas só existem na Visão "Este mês" — a tabela (Visão geral) não mostra esses dois por enquanto.
