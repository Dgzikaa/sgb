# 🎮 Banner Animado Hela - Twitch/OBS

Banner animado para aparecer na live da Twitch, mostrando a Hela e os benefícios de fazer a quest.

## 📋 Como Usar no OBS

### 1️⃣ Preparar as Imagens

Coloque as seguintes imagens na pasta `assets/`:

- **hela.png** - Imagem da personagem Hela (PNG com fundo transparente)
- **simbolo-deus-sol.png** - Ícone do Símbolo do Deus-Sol
- **foice-deusa.png** - GIF ou PNG da Foice da Deusa do Submundo

### 2️⃣ Adicionar no OBS

1. Abra o OBS Studio
2. Clique em **"+"** em **Fontes**
3. Selecione **"Navegador"** (Browser Source)
4. Configure:
   - **Nome**: Banner Hela
   - **URL**: Marque "Local file" e selecione o arquivo `index.html`
   - **Largura**: 400
   - **Altura**: 800
   - ✅ Marque: "Shutdown source when not visible"
   - ✅ Marque: "Refresh browser when scene becomes active"

### 3️⃣ Posicionar na Tela

- O banner vai aparecer no **canto inferior direito**
- Ele sobe da parte de baixo da tela
- Fica visível por alguns segundos
- Depois sobe e desaparece
- O ciclo se repete automaticamente

### 4️⃣ Ajustar Timing (Opcional)

Para mudar a velocidade da animação, edite no arquivo `index.html`:

```css
animation: slideUp 12s infinite;
```

- **12s** = 12 segundos por ciclo completo
- Diminua para mais rápido (ex: 8s)
- Aumente para mais lento (ex: 15s)

## 🎨 Estrutura do Banner

```
┌─────────────────────┐
│   [Imagem Hela]     │ ← Animação flutuante
├─────────────────────┤
│  CANSOU DE TROCAR   │ ← Título com brilho
│     VESTIDO?        │
├─────────────────────┤
│ ⭐ RECOMPENSAS ⭐   │
│ 🌞 Símbolo Deus-Sol │ ← Ícone girando
│ ⚔️  Foice da Deusa  │ ← Ícone brilhando
└─────────────────────┘
```

## ⚙️ Personalizações

### Cores do Tema

No CSS, você pode mudar as cores principais:

- **Borda Cyan**: `#00ffff`
- **Fundo Preto**: `rgba(0, 0, 0, 0.85)`
- **Texto Branco**: `#fff`

### Tamanho do Banner

```css
.banner-container {
    width: 350px;  /* Largura */
}

.hela-image {
    width: 200px;  /* Tamanho da Hela */
    height: 250px;
}
```

## 🔧 Requisitos

- **OBS Studio** (versão 27.0 ou superior recomendado)
- Imagens em formato **PNG** ou **GIF**
- Navegador moderno com suporte a CSS3

## 📝 Notas

- O fundo é **100% transparente** para não interferir na live
- Os elementos têm fundo semi-transparente preto para legibilidade
- A animação é suave e não impacta performance
- Reinicia automaticamente em loop

## 🎯 Efeitos Incluídos

✨ **Hela**: Animação de flutuação suave
✨ **Título**: Efeito pulsante de brilho cyan
✨ **Símbolo do Deus-Sol**: Rotação lenta contínua
✨ **Foice**: Brilho pulsante cyan
✨ **Banner**: Desliza de baixo para cima

---

**Desenvolvido para a Twitch** 🎮
