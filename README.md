# daniel-churrasco

# Churrascômetro — Chance do Daniel fazer churrasco

Estimativa de zoação, em português, da chance de o Daniel fazer churrasco e tomar uma gelada **hoje**. Não é previsão científica. A conta usa o horário de Brasília e o clima de Londrina (PR). Quando uma fonte externa falha, o fator correspondente entra neutro e a página continua de pé.

Não tem login, banco nem segredo. O horóscopo fica de fora até alguém revelar o signo.

## Como rodar

```bash
npm install
npm test
npm run dev
```

`npm test` cobre a vontade (0, 50 e 100), a briga, os tetos de projetos e bugs, e entradas inválidas. Abre [http://localhost:3000](http://localhost:3000).

```bash
npm run build
npm run start
```

`npm run preview` faz o mesmo que `npm run start` (sobe o build de produção do Next.js).

## Cloudflare Workers

O deploy previsto é [vinext](https://vinext.dev/) em Cloudflare Workers, com o repositório privado no Origin como fonte. Não usa Vercel.

Cache compartilhado fica desligado de propósito: clima, feriado, jogos e a checagem do STF são buscados no pedido. Não há binding de KV, Images nem segundo Worker. O único recurso é o Worker `daniel-churrasco`.

```bash
npm install
npm run build:vinext
npm run start:vinext -- --port 43127 --host 0.0.0.0
```

Deploy, com a conta Cloudflare já autenticada no `cf`:

```bash
npm run deploy:vinext
```

No Workers Builds, conecte o repositório Origin (app Cloudflare no Cursor), aponte a branch de produção e use:

- Build command: `npm run build:vinext`
- Deploy command: `npm run deploy:vinext`

Não há secret, DNS nem rota customizada. O subdomínio `*.workers.dev` basta.

## A conta

A chance começa em **20 pontos de teimosia** e soma o resto, com teto entre 0% e 100%. Quatro palpites ficam só no navegador e não entram nas fontes: **Vontade dele agora** (0 tira 20, 50 não mexe, 100 soma 20), **Brigou com a mulher?** (não mexe; sim tira 15, sem afirmar nada da vida real), **Projetos em andamento** (−2 cada, penalidade máxima −10) e **Bugs para resolver** (−1 cada, penalidade máxima −15). O padrão é 50, não, 0 e 0, então a conta antiga continua igual até alguém mexer.

| Fator | O que faz | Peso |
| --- | --- | --- |
| Clima em Londrina | Sol ameno sobe; chuva forte e temporal derrubam | de −14 a +28 |
| Feriado nacional | Feriado sobe bastante; sexta, sábado e domingo sobem um pouco | até +18 |
| Índice da gelada | Promo simulada, estável no dia, sem preço real | até +14 |
| Jogo do SPFC | Jogo hoje sobe; clássico sobe mais | até +18 |
| Jogo da Seleção | Jogo hoje é o maior empurrão esportivo | até +20 |
| Impeachment no STF | Neutro se não houver manchete afirmativa. Não conclui que houve nem que não houve | +40 só com manchete explícita |

O veredito vai de “Pode ligar o carvão” até “O Daniel vai ficar no sofá”. O botão **Compartilhar** copia uma frase curta com a porcentagem.

## Fontes

- **Clima:** [Open-Meteo](https://open-meteo.com/), sem chave. Coordenadas −23,3045, −51,1696 (Londrina/PR). Entram temperatura, chuva e código do tempo de agora e do dia.
- **Feriados:** [BrasilAPI](https://brasilapi.com.br/) `GET /api/feriados/v1/{ano}`. Se cair, o app usa uma lista local dos feriados nacionais de 2026. Fim de semana continua valendo mesmo sem a API.
- **Cerveja:** não há API pública nacional de preço. O “índice da gelada” é **aproximado/simulado**: Skol, Brahma e Heineken recebem uma promo estável para a data (o mesmo dia não muda), e sexta–domingo pesa mais. Não existe URL de loja inventada.
- **SPFC e Seleção:** agenda da [ESPN](https://www.espn.com/) e da [TheSportsDB](https://www.thesportsdb.com/) (chave pública de teste `123`, sem segredo). Jogo “hoje” usa o calendário de Brasília. Se as duas fontes falharem, o card diz “Calendário indisponível” e o peso fica neutro.
- **STF:** checagem leve no feed de política da [Agência Brasil (EBC)](https://agenciabrasil.ebc.com.br/politica). Só soma ponto se uma manchete recente afirmar impeachment ou cassação de ministro. Sem essa manchete, ou se o feed falhar, o fator fica **não verificado** e neutro. Isso não afirma que houve impeachment nem que não houve.

Nenhum script de rastreamento entra no projeto.
