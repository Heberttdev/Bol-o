// src/components/SplashAnimation.jsx

import "./SplashGate.css";


// IMPORTANTE:
// Coloque a imagem do escudo em:
//
// src/assets/images/shield.png
//
// ou altere o caminho abaixo conforme desejar.
import shield from "../assets/images/shield.png";

export default function SplashAnimation({ animando, saindo }) {
  return (
    <div className={`splash ${saindo ? "fade-out" : ""}`}>

      {/* Glow */}
      <div className={`splash-glow ${animando ? "show" : ""}`} />

      {/* Escudo */}
      <div className={`shield-container ${animando ? "show" : ""}`}>

    
        {/* Escudo */}
        <img
          src={shield}
          alt="Bolão Green"
          className="shield"
        />

      </div>

      {/* Nome */}
      <div className={`title ${animando ? "show" : ""}`}>

        <h1>
          Bolão Green
        </h1>

        <p>
          Faça seus palpites
        </p>

      </div>

      {/* Barra */}
      <div className={`loading ${animando ? "show" : ""}`}>

        <div className="loading-bar">
          <div className="loading-progress" />
        </div>

      </div>

    </div>
  );
}