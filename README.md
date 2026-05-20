# 🎮 Money Quest — RPG Financiero de Pareja

> Ahorra, compite y conquista... ¡juntos!

---

## 🎯 ¿Qué es Money Quest?

Un juego RPG para parejas donde competís durante el mes completando retos financieros, ahorrando dinero y tomando buenas decisiones. 

Al final del mes, **quien tenga más EXP gana el "Poder Supremo"** y puede elegir un plan, cita, capricho o decisión acordada. 👑

---

## ✨ Características

| Funcionalidad | Descripción |
|---------------|-------------|
| ⚡ **Tiempo real** | Ambos jugadores ven los cambios al instante |
| 🔑 **Código de sesión** | Conectaos con un código único (ej: DRAGON123) |
| ☁️ **Guardado en la nube** | Los datos se guardan automáticamente |
| 📊 **5 Niveles** | De Aprendiz del Ahorro a Leyenda del Dinero |
| ⚔️ **10 Retos** | Diarios y semanales con diferentes dificultades |
| 🛒 **Tienda** | 6 objetos con efectos únicos (sabotaje, potenciador, etc.) |
| 📜 **Historial** | Registro completo de todas las acciones |

---

## 🚀 Cómo empezar

### Requisitos
- Tener instalado [Node.js](https://nodejs.org/) (v18 o superior)

### Instalación

```bash
# 1. Abre una terminal en la carpeta del proyecto
cd money-quest

# 2. Instala las dependencias (solo la primera vez)
npm install

# 3. Inicia el servidor
npm start
```

### Jugar

1. Abre tu navegador en `http://localhost:3333`
2. **Jugador 1**: Introduce tu nombre y pulsa "Crear Aventura"
3. Copia el código de sesión que aparece (ej: `DRAGON456`)
4. **Jugador 2**: Abre la misma URL en otro dispositivo, introduce el código y su nombre, y pulsa "Unirse"
5. ¡A jugar! 🎉

---

## 📖 Reglas del juego

### 👥 Perfil de jugador
Cada jugador tiene:
- **Nombre de guerrero/a** financiero
- **Nivel** (1–5)
- **EXP** (puntos de experiencia)
- **Monedas** (💰 para comprar en la tienda)
- **Inventario** (objetos comprados)
- **Habilidades activas** (efectos temporales)

### 📊 Niveles

| Nivel | EXP necesaria | Título |
|-------|--------------|--------|
| 1 | 0 EXP | 🥉 Aprendiz del Ahorro |
| 2 | 100 EXP | 🥈 Guerrero del Presupuesto |
| 3 | 250 EXP | 🥇 Caballero de la Inversión |
| 4 | 450 EXP | 💎 Maestro Financiero |
| 5 | 700 EXP | 👑 Leyenda del Dinero |

### ⚔️ Retos disponibles

| Reto | EXP | Monedas | Dificultad |
|------|-----|---------|------------|
| 🏦 Día Anti-Gasto | 30 | 15 | ⭐⭐ |
| 🍳 Chef Casero | 20 | 10 | ⭐ |
| 🔍 Caza Ofertas | 15 | 20 | ⭐ |
| 📊 Presupuesto Relámpago | 25 | 5 | ⭐⭐ |
| 🚫 Ayuno de Apps | 20 | 10 | ⭐⭐ |
| 🐷 Ahorro Semanal | 40 | 15 | ⭐⭐⭐ |
| 📚 Gasto Positivo | 25 | 10 | ⭐⭐ |
| 📋 Mini Auditoría | 20 | 15 | ⭐ |
| 🔄 Trueque Maestro | 15 | 10 | ⭐ |
| 💑 Reto en Pareja | 35 | 20 | ⭐⭐⭐ |

> ⚠️ Cada reto solo se puede completar **una vez al día**.

### 🛒 Tienda de objetos

| Objeto | Coste | Tipo | Efecto |
|--------|-------|------|--------|
| 🛡️ Escudo Anti-Capricho | 50 💰 | Sabotaje | Anula 1 gasto impulsivo del rival |
| ⚡ Multiplicador EXP | 80 💰 | Potenciador | x2 EXP en tu siguiente reto |
| 🪙 Robo Educativo | 60 💰 | Sabotaje | Quita 20 monedas al rival |
| 💝 Bendición Compartida | 40 💰 | Cooperativo | Ambos ganan +10 EXP |
| 🔰 Escudo Anti-Robo | 30 💰 | Defensa | Protege tus monedas |
| 🎲 Dado Doble | 45 💰 | Potenciador | 2 retos, elige el mejor |

---

## 🏆 Fin de mes

Al final del mes:
1. El jugador con más EXP gana el **Poder Supremo** 👑
2. Puede elegir: plan, cita, capricho o decisión acordada
3. Si ambos llegan a cierta EXP conjunta → **recompensa conjunta**
4. Se reinicia el mes y ¡a por el siguiente!

---

## 🛠️ Tecnología

- **Backend**: Node.js + Express + Socket.IO
- **Frontend**: HTML5 + CSS3 + JavaScript vanilla
- **Tiempo real**: WebSockets (Socket.IO)
- **Persistencia**: Archivo JSON local (actualizable a Supabase/Firebase)

---

## 📁 Estructura del proyecto

```
money-quest/
├── server.js          # Backend: Express + Socket.IO + lógica del juego
├── package.json       # Dependencias y configuración
├── public/
│   └── index.html     # Frontend: UI completa del juego
├── game_data.json     # Datos guardados (se crea automáticamente)
└── README.md          # Este archivo
```

---

## 🔄 Actualizar a almacenamiento en la nube real

Para usar una base de datos en la nube (recomendado para jugar desde cualquier sitio):

### Opción A: Supabase (gratis)
1. Crea cuenta en [supabase.com](https://supabase.com)
2. Crea una tabla `sessions`
3. Conecta con las credenciales

### Opción B: Firebase (gratis)
1. Crea proyecto en [Firebase](https://firebase.google.com)
2. Usa Firestore para guardar sesiones
3. Configura las credenciales en el servidor

---

¡Disfrutad del juego y que gane el mejor ahorrador! 💰👑
