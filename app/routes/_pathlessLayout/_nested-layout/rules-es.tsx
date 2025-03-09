import { createFileRoute } from "@tanstack/react-router";
import { Caret } from "~/components/ui/Caret";
import { useBearStore } from "~/utils/zustand";

export const Route = createFileRoute(
  "/_pathlessLayout/_nested-layout/rules-es"
)({
  component: LayoutBComponent,
});

function LayoutBComponent() {
  const { rulesConfig } = useBearStore();
  const { topN, totalPool, minPayout, minMods, vector } = rulesConfig;

  return (
    <div className="prose dark:prose-invert flex flex-col gap-4">
      <details open className="group w-full">
        <summary className="flex w-full cursor-pointer items-center justify-between rounded-lg p-3 hover:bg-neutral-100 dark:hover:bg-neutral-900">
          <span className="text-lg sm:text-xl font-bold">General</span>
          <Caret />
        </summary>
        <div className="prose dark:prose-invert prose-neutral mt-4 px-3 pb-4 max-w-none">
          <ul>
            <li>Concursa semanal, mismo horario que Warpcast Rewards</li>
            <li>
              <strong>{topN}</strong> SassyHash más engajadas compartirán un{" "}
              <strong>${totalPool}</strong> pool
            </li>
            <li>Un usuario puede ganar más por múltiples casts</li>
            <li>
              Intentos de farming/juego son bienvenidos y serán recompensados!
              Aprendemos en público
            </li>
            <li>
              Anti-collusion basada en "decentralized retroactive delegation"
            </li>
          </ul>
        </div>
      </details>
      <details className="group w-full">
        <summary className="flex w-full cursor-pointer items-center justify-between rounded-lg p-3 hover:bg-neutral-100 dark:hover:bg-neutral-900">
          <span className="text-lg sm:text-xl font-bold">💲🎩🌯 Pago</span>
          <Caret />
        </summary>
        <div className="prose dark:prose-invert prose-neutral mt-4 px-3 pb-4 max-w-none">
          <ul>
            <li>
              Pago mínimo es <strong>${minPayout}</strong> por FID en el
              Leaderboard
            </li>
            <li>
              Pago a tu última dirección Ethereum verificada (generalmente, tu
              Warpcast Wallet)
            </li>
            <ul>
              <li>60% $USDC on Base</li>
              <li>30% $DEGEN on Degen L3</li>
              <li>10% $BURRITO on Base</li>
            </ul>
            <li>
              Pago máximo es <strong>${totalPool}</strong> (si hiciste todos los
              Top {topN} casts para la semana)
            </li>
          </ul>
        </div>
      </details>
      <details className="group w-full">
        <summary className="flex w-full cursor-pointer items-center justify-between rounded-lg p-3 hover:bg-neutral-100 dark:hover:bg-neutral-900">
          <span className="text-lg sm:text-xl font-bold">Anti-Trampas 🕵️‍♀️</span>
          <Caret />
        </summary>
        <div className="prose dark:prose-invert prose-neutral mt-4 px-3 pb-4 max-w-none">
          <ul>
            <li>
              Cada cast califica por obtener un mínimo de likes por parte de
              SassyMods 💁‍♀️ / Sassquatch 🦧
            </li>
            <li>
              Comienza con <strong>{minMods}</strong>, aumentará según sea
              necesario
            </li>
            <li>
              Ningún moderador individual tiene influencia desproporcionada
            </li>
            <li>
              Los mods pueden aceptar sobornos y coludir, pero pueden ser
              llamados y excluidos
            </li>
            <li>¡No hay veto, te amo!"</li>
          </ul>
        </div>
      </details>
      <details className="group w-full">
        <summary className="flex w-full cursor-pointer items-center justify-between rounded-lg p-3 hover:bg-neutral-100 dark:hover:bg-neutral-900">
          <span className="text-lg sm:text-xl font-bold">📊 Cerebritos</span>
          <Caret />
        </summary>
        <div className="prose dark:prose-invert prose-neutral mt-4 px-3 pb-4 max-w-none">
          <ul>
            <li>Puntuación bruta para cada cast: </li>
            <ol>
              <li>miradas x {vector.views.toLocaleString()}</li>
              <li>likes de SassyMods: x {vector.likes.toLocaleString()}</li>
              <li>
                respuestas de otros usuarios, que reciben likes del caster
                original: x {vector.replies.toLocaleString()}
              </li>
            </ol>
            <li>Puntuación bruta ➡️ Puntuación suave via función arctan 🤓</li>
            <ul>
              <li>toma de extremos, los mueve al medio</li>
              <li>
                recompensa la repetición más que las notas altas (ya se ha
                recompensado suficiente)
              </li>
            </ul>
            <li>
              <strong>${minPayout}</strong> se asigna a cada FID único en el
              leaderboard
            </li>
            <li>
              <strong>Resto del pool</strong> distribuido pro-rata según la
              puntuación suave
            </li>
          </ul>
        </div>

        <details className="group w-full">
          <summary className="flex w-full cursor-pointer items-center justify-between rounded-lg p-3 hover:bg-neutral-100 dark:hover:bg-neutral-900">
            <span className="text-lg sm:text-xl font-bold">
              ¿Qué es $BURROTI?
            </span>
            <Caret />
          </summary>
          <div className="prose dark:prose-invert prose-neutral mt-4 px-3 pb-4 max-w-none">
            <ul>
              <li>
                🌯 BURROTI es un [
                <a
                  href="https://www.clanker.world/clanker/0x097745F2FB83C104543F93E528B455FC3cE392b6"
                  target="_blank"
                  rel="noreferrer"
                >
                  clanker v0
                </a>
                ], y mi Fan Token personal.
              </li>
              <li>CA: 0x097745F2FB83C104543F93E528B455FC3cE392b6 [Base]</li>
              <li>
                Recibí cero tokens al lanzamiento, y negocié contra spammers
                para obtener mi asignación. Compro más tokens con todos mis fees
                de negociación.
              </li>
              <li>
                Cambia tus tokens; haz lo que quieras con ellos. Yo compraré lo
                que dé.
              </li>
            </ul>
          </div>
        </details>
      </details>
    </div>
  );
}
