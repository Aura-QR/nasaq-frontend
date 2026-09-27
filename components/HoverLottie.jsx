// HoverLottie.tsx
import { useEffect, useRef } from "react";
import Lottie from "lottie-react";

const HoverLottie = ({icon , w , h , play}) => {

  const lottieRef = useRef(null);

  useEffect(() => {
    if (play) {
      lottieRef.current?.play();
    } else {
      lottieRef.current?.stop();
    }
  } , [play])

  return (
    <div style={{ width: w, height: h, cursor: "pointer" , transition : ".5s" }}>
      <Lottie
        lottieRef={lottieRef}
        animationData={icon}
        autoplay={true}
        loop={false}
        className="transition-all"
      />
    </div>
  );
};

export default HoverLottie;
