# KAIROS – App Mobile (Android e iOS)

App da **KAIROS – Rede Autônoma de Recursos**, CitizenTech da Global Solution FIAP 2026.2.
Conecta quem doa a quem precisa: prioriza as comunidades por **urgência × vulnerabilidade × população**
e monta a carga ideal de cada veículo com **programação dinâmica (problema da mochila 0/1)**.

## Ficha da CitizenTech

| Campo | Resposta |
|---|---|
| **Nome** | KAIROS — Rede Autônoma de Recursos |
| **Cidade e bairro** | São Paulo – SP · Jardim Ângela (zona sul), com expansão para comunidades da Grande SP |
| **Cidadão beneficiado** | Famílias em vulnerabilidade social e as ONGs, bancos de alimentos e voluntários que as atendem |
| **Problema** | Recursos doados se perdem ou chegam a quem não mais precisa porque não há coordenação entre oferta e necessidade. |
| **Como funciona** | Doadores cadastram recursos, comunidades pedem com urgência, o KAIROS prioriza e monta o plano de entrega ótimo. |
| **Indicador de impacto** | % de pedidos atendidos em até 48h e kg entregues antes do vencimento |
| **ODS** | 1, 2, 10, 11 e 12 |

## O que o app cobre

| Parte da solução | Onde está no app |
|---|---|
| Perfis (doador, comunidade, equipe) | Tela de entrada |
| Cadastrar doação (recurso) | Botão amarelo **+** / Doar um recurso |
| Pedir ajuda com urgência | Pedir ajuda (mostra a prioridade e a posição na fila na hora) |
| Priorização das comunidades | Início (mais urgente agora) e Comunidades (ranking) |
| Otimização da carga (mochila 0/1) | Entrega → Calcular a melhor carga |
| Despacho e rastreio | Entrega → Confirmar e despachar · Pedidos → Em rota |
| Impacto e engajamento | Início (progresso do dia, kg, famílias, sequência) · Perfil (conquistas, ODS) |

## Tecnologias

- Expo SDK 58 · React Native 0.88 · TypeScript
- React Navigation (pilha + abas com tab bar em pílula)
- react-native-svg (anéis de progresso, ilustração), expo-haptics, AsyncStorage
- API: Spring Boot + Oracle no Render – https://kairos-api-mwgk.onrender.com
  (se a API estiver dormindo ou sem internet, o app usa dados locais e o mesmo algoritmo no aparelho)

## Como rodar

```bash
npm install
npx expo start
```

Abra o app **Expo Go** no celular (Android ou iPhone) e leia o QR code.
Para ver no navegador: `npx expo start --web`.

## Estrutura

```
App.tsx              navegação e tab bar
src/api.ts           tipos, chamadas à API, otimização local e dados de demonstração
src/store.tsx        estado global (dados, perfil, tema, impacto)
src/theme.ts         cores e tipografia
src/ui.tsx           componentes (cards, anel, barra, chips, ícones)
src/screens/         Welcome, Home, Pedidos, Comunidades, Entrega, Perfil, Forms (Doar/Pedir)
```



## Integrante
 
Guilherme De Araujo – RM 561848 – Turma 2ESPI  
Leonardo Da Silva Pinto – RM 564929 – Turma 2ESPI  
Samuel Enzo Domingues Monteiro – RM 564391 – Turma 2ESPI

## Integrante

Guilherme De Araujo – RM 561848 – Turma 2ESPI
