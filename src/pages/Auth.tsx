import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

export default function Auth() {
  const { signIn, signUp } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [signUpSuccess, setSignUpSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (isLogin) {
      const { error } = await signIn(email, password);
      if (error) setError(error.message);
    } else {
      const { error } = await signUp(email, password, displayName);
      if (error) {
        setError(error.message);
      } else {
        setSignUpSuccess(true);
      }
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm"
      >
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground tracking-tight">Clara</h1>
          <p className="text-sm text-muted-foreground mt-1">Tu copiloto financiero</p>
        </div>

        {signUpSuccess ? (
          <div className="card-calm p-6 text-center">
            <div className="text-4xl mb-3">📧</div>
            <p className="text-foreground font-medium">Revisa tu correo</p>
            <p className="text-sm text-muted-foreground mt-2">Te enviamos un enlace de confirmación para activar tu cuenta.</p>
            <button onClick={() => { setSignUpSuccess(false); setIsLogin(true); }}
              className="mt-4 text-sm text-primary font-medium hover:underline">
              Volver al inicio de sesión
            </button>
          </div>
        ) : (
          <div className="card-calm p-6">
            {/* Toggle */}
            <div className="flex bg-secondary rounded-lg p-1 mb-6">
              <button onClick={() => setIsLogin(true)}
                className={cn("flex-1 py-2 text-sm font-medium rounded-md transition-all",
                  isLogin ? "bg-card text-foreground shadow-sm" : "text-muted-foreground")}>
                Entrar
              </button>
              <button onClick={() => setIsLogin(false)}
                className={cn("flex-1 py-2 text-sm font-medium rounded-md transition-all",
                  !isLogin ? "bg-card text-foreground shadow-sm" : "text-muted-foreground")}>
                Crear cuenta
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <div>
                  <label className="text-label mb-1.5 block">Nombre</label>
                  <input type="text" value={displayName} onChange={e => setDisplayName(e.target.value)}
                    placeholder="Tu nombre"
                    className="w-full py-2.5 px-3 rounded-lg bg-secondary text-foreground text-sm outline-none placeholder:text-muted-foreground/50 focus:ring-2 focus:ring-ring/20" />
                </div>
              )}

              <div>
                <label className="text-label mb-1.5 block">Email</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                  placeholder="tu@email.com"
                  className="w-full py-2.5 px-3 rounded-lg bg-secondary text-foreground text-sm outline-none placeholder:text-muted-foreground/50 focus:ring-2 focus:ring-ring/20" />
              </div>

              <div>
                <label className="text-label mb-1.5 block">Contraseña</label>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} required
                  minLength={6} placeholder="Mínimo 6 caracteres"
                  className="w-full py-2.5 px-3 rounded-lg bg-secondary text-foreground text-sm outline-none placeholder:text-muted-foreground/50 focus:ring-2 focus:ring-ring/20" />
              </div>

              {error && <p className="text-sm text-danger">{error}</p>}

              <button type="submit" disabled={loading}
                className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-medium text-sm transition-all hover:opacity-90 disabled:opacity-40">
                {loading ? 'Cargando...' : isLogin ? 'Entrar' : 'Crear cuenta'}
              </button>
            </form>
          </div>
        )}
      </motion.div>
    </div>
  );
}
