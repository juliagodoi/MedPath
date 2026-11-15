# MedPath — calendário, revisões e caderno de erros

Esta versão foi preparada a partir do arquivo `MedPath-main(2).zip` enviado na conversa. O Firebase, login, banco de questões e demais dados não foram modificados.

## O que mudou

- **Cronograma → Calendário:** clique no dia para abrir uma janela com **todas** as atividades, sem o limite de dois eventos por célula. A janela permite marcar tarefas e revisões, editar tarefas e adicionar atividades.
- **Expandir calendário:** botão no cabeçalho do mês mostra todos os títulos dentro das células e amplia a visualização até o tamanho da tela; clique em **Recolher calendário** para voltar.
- **Revisões:** uma área própria no menu principal, com revisões **para hoje**, **próximas** e **histórico de realizadas**.
- **Marcar como feita:** apenas a confirmação explícita registra uma revisão como concluída. A conclusão é armazenada junto com a data efetiva.
- **Reagendamento automático:** a revisão pendente de uma data já vencida volta a aparecer **hoje**. As próximas etapas D+7 e D+30 são deslocadas pelo atraso; reforços extras vencidos voltam a aparecer hoje, sem serem considerados concluídos. O planejamento é recalculado quando a página é aberta em um novo dia.
- **Caderno de erros corrigido:** inclui automaticamente erros de resultados lançados em **Questões feitas** e de respostas incorretas no banco interno. Os totais são agrupados por assunto e deixam de mostrar a mensagem incorreta de que nenhum erro foi registrado quando existem lançamentos.
- **Editar erros por assunto:** no Caderno, o botão **+ Questões** foi substituído por **Editar erros**. É possível adicionar, alterar e excluir os subtópicos em que errou, classificá-los como **Falta de atenção** ou **Não sabia**, registrar uma observação e sinalizar quando a dificuldade foi superada. Cada subtópico adicionado equivale a uma questão errada, sem campo de quantidade.
- **Revisões com foco individualizado:** o calendário e a área **Revisões** destacam os subtópicos ainda pendentes, com causa e observação, enquanto mantêm a revisão do assunto inteiro. Um subtópico marcado como superado deixa de ser sinalizado nas próximas revisões.
- **Menu de Questões simplificado:** as guias são **Questões feitas**, **Banco** e **Caderno de erros**. A guia **Histórico** foi retirada do menu, e **Banco** não mostra mais um contador entre parênteses. O texto explicativo abaixo de **Erros por assunto** também foi removido.

Os erros que já constam em **Questões feitas** não são duplicados quando recebem subtópicos. Se forem cadastrados mais subtópicos do que erros já lançados em um assunto, o excedente passa a contar como questão errada ainda não registrada. O Caderno mostra quantas questões já tiveram seu erro detalhado.

Exemplo: um conteúdo estudado no dia 1 teria revisões nos dias 2, 8 e 31. Se a primeira não for marcada e só for concluída no dia 5, as seguintes passam para os dias 11 e 34. Nenhuma revisão desaparece por não ter sido marcada.

## Publicação

1. Faça um backup dos arquivos atuais do GitHub.
2. Substitua os arquivos públicos pelos deste ZIP, mantendo a estrutura `MedPath-main/` usada no seu repositório.
3. Aguarde o GitHub Pages atualizar e recarregue o MedPath no navegador. O cache do aplicativo foi versionado para incluir `calendario-revisoes.js` e `caderno-erros.js`.

Os dados pessoais existentes continuam salvos no mesmo documento do Firestore. O novo código não apaga histórico nem substitui o banco de questões. Nenhuma escrita remota foi executada durante o preparo deste arquivo.
