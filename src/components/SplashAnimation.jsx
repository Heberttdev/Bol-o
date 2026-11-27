
import "./SplashGate.css";
import shield from "../assets/shield.webp";
import shield160 from "../assets/shield-160.webp";
import shield320 from "../assets/shield-320.webp";

export default function SplashAnimation({ animando, saindo }) {
  return (
    <div className={`splash ${saindo ? "fade-out" : ""}`}>

      <div className={`splash-glow ${animando ? "show" : ""}`} />

      <div className={`shield-container ${animando ? "show" : ""}`}>

    
        <img
          src={shield320}
          srcSet={`${shield160} 160w, ${shield320} 320w, ${shield} 600w`}
          sizes="190px"
          alt="Bolão Green"
          className="shield"
          width="190"
          height="190"
          fetchpriority="high"
          decoding="async"
        />

      </div>

      <div className={`title ${animando ? "show" : ""}`}>

        <h1>
          Bolão Green
        </h1>

        <p>
          Faça seus palpites
        </p>

      </div>

      <div className={`loading ${animando ? "show" : ""}`}>

        <div className="loading-bar">
          <div className="loading-progress" />
        </div>

      </div>

    </div>
  );
}