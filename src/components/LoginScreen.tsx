import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useBrand } from '../contexts/BrandContext';
import { 
  Box, 
  Card, 
  CardContent, 
  TextField, 
  Button, 
  Typography, 
  Alert, 
  CircularProgress,
  IconButton,
  InputAdornment,
  Divider
} from '@mui/material';
import { Eye, EyeOff, Camera, Lock, Mail, UserPlus, Sparkles, Chrome } from 'lucide-react';

export const LoginScreen: React.FC = () => {
  const { login, signup, loginWithGoogle, loginWithGoogleRedirect, resetPassword } = useAuth();
  const { settings } = useBrand();
  const [isRegistering, setIsRegistering] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [isInIframe] = useState(() => {
    try {
      return window.self !== window.top;
    } catch (e) {
      return true;
    }
  });

  const [isMobileDevice] = useState(() => {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  });

  const formatAuthError = (err: any): string => {
    const code = err?.code || '';
    const message = err?.message || '';

    if (code === 'auth/invalid-credential' || code === 'auth/wrong-password' || code === 'auth/user-not-found') {
      return 'Incorrect email or password. Please verify your credentials and try again.';
    }
    if (code === 'auth/email-already-in-use') {
      return 'This email address is already registered. Please sign in instead.';
    }
    if (code === 'auth/weak-password') {
      return 'The password is too weak. Please use a password with at least 6 characters.';
    }
    if (code === 'auth/invalid-email') {
      return 'Please enter a valid email address.';
    }
    if (code === 'auth/popup-closed-by-user' || message.includes('popup-closed-by-user')) {
      return 'The Google Sign-In popup was closed before completion. If you are using the embedded preview, please click "Open in New Tab" at the top-right to log in securely, or use the "Sign In with Google (Redirect)" button.';
    }
    if (code === 'auth/popup-blocked' || message.includes('popup-blocked')) {
      return 'The Google Sign-In popup was blocked by your browser. Please allow popups or use the "Sign In with Google (Redirect)" button.';
    }
    if (code === 'auth/operation-not-allowed') {
      return 'This sign-in method is not enabled. Please enable it in the Firebase Console.';
    }
    if (code === 'auth/network-request-failed') {
      return 'A network error occurred. Please check your internet connection and try again.';
    }
    if (code === 'auth/too-many-requests') {
      return 'Access to this account has been temporarily disabled due to many failed login attempts. Try again later or reset your password.';
    }

    if (message.startsWith('Firebase:')) {
      return message.replace('Firebase:', '').replace(/Error\s*\((.*?)\)\.?/, '$1').trim();
    }
    return message || 'An error occurred during authentication.';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setLoading(true);

    try {
      if (isForgotPassword) {
        if (!email.trim()) {
          throw new Error('Please enter your email address');
        }
        await resetPassword(email);
        setSuccessMessage('A password reset link has been sent to your email. Please check your inbox.');
      } else if (isRegistering) {
        if (!name.trim()) {
          throw new Error('Please enter your full name');
        }
        await signup(email, password, name);
      } else {
        await login(email, password);
      }
    } catch (err: any) {
      console.error(err);
      setError(formatAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError(null);
    setLoading(true);
    try {
      await loginWithGoogle();
    } catch (err: any) {
      console.error(err);
      setError(formatAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLoginRedirect = async () => {
    setError(null);
    setLoading(true);
    try {
      await loginWithGoogleRedirect();
    } catch (err: any) {
      console.error(err);
      setError(formatAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box className="min-h-screen flex items-center justify-center bg-[#0D0D0C] relative px-4 overflow-hidden">
      {/* Decorative Golden Ambient Blurs */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-[radial-gradient(circle,_rgba(212,175,55,0.08)_0%,_transparent_70%)] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-[radial-gradient(circle,_rgba(170,124,17,0.06)_0%,_transparent_70%)] pointer-events-none" />

      <Card className="w-full max-w-md border border-gold-glow backdrop-blur-md bg-[#141413]/90 relative z-10 p-4">
        <CardContent className="flex flex-col items-center">
          {/* Logo */}
          <Box className="w-16 h-16 rounded-full border-2 border-[#D4AF37] flex items-center justify-center bg-black/40 mb-6 border-gold-glow overflow-hidden">
            {settings.studioLogo ? (
              <img src={settings.studioLogo} alt="Logo" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            ) : (
              <Camera className="w-8 h-8 text-[#D4AF37]" />
            )}
          </Box>

          {/* Luxury Brand Title */}
          <Typography variant="h4" className="text-gold-gradient text-center font-bold tracking-widest mb-1 font-serif uppercase">
            {settings.studioLogo ? settings.studioName : "Asmaul Production"}
          </Typography>
          <Typography variant="caption" className="text-gray-500 tracking-[0.25em] uppercase text-center mb-6 block text-xs">
            {settings.studioTagline}
          </Typography>

          {error && (
            <Alert severity="error" className="w-full mb-4 border border-red-900/30 bg-red-950/20 text-red-200">
              {error}
            </Alert>
          )}

          {successMessage && (
            <Alert severity="success" className="w-full mb-4 border border-green-900/30 bg-green-950/25 text-green-200">
              {successMessage}
            </Alert>
          )}

          {(isInIframe || isMobileDevice) && (
            <Box className="w-full p-4 mb-5 rounded-lg border border-[#D4AF37]/20 bg-[#1A1A17]/60 text-gray-300 text-xs space-y-2">
              <div className="flex items-center gap-2 font-bold tracking-widest text-[#D4AF37] uppercase text-[10px]">
                <Sparkles className="w-3.5 h-3.5" />
                Mobile / Preview Mode Tip
              </div>
              <p className="leading-relaxed">
                Third-party cookie restrictions (like Apple Safari ITP) block Google Sign-In inside iframe previews.
              </p>
              <ul className="list-disc list-inside text-gray-400 space-y-1.5 pl-0.5">
                <li>
                  Use <strong className="text-[#D4AF37]">Email & Password</strong> sign-in/registration for 100% reliable offline-sync.
                </li>
                <li>
                  To use <strong className="text-[#D4AF37]">Google Sign-In</strong>, tap <span className="text-white underline">Open in New Tab</span> at the top-right to run the app outside of the preview iframe.
                </li>
              </ul>
            </Box>
          )}

          <form onSubmit={handleSubmit} className="w-full space-y-4">
            {isRegistering && (
              <TextField
                fullWidth
                label="Full Name"
                variant="outlined"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                disabled={loading}
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <Sparkles className="w-4 h-4 text-[#AA7C11]" />
                      </InputAdornment>
                    ),
                  }
                }}
              />
            )}

            <TextField
              fullWidth
              label="Email Address"
              type="email"
              variant="outlined"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <Mail className="w-4 h-4 text-[#AA7C11]" />
                    </InputAdornment>
                  ),
                }
              }}
            />

            {!isForgotPassword && (
              <TextField
                fullWidth
                label="Password"
                type={showPassword ? 'text' : 'password'}
                variant="outlined"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <Lock className="w-4 h-4 text-[#AA7C11]" />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                          {showPassword ? <EyeOff className="w-4 h-4 text-gray-500" /> : <Eye className="w-4 h-4 text-gray-500" />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }
                }}
              />
            )}

            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={loading}
              className="mt-6 font-bold tracking-wider py-3 shadow-lg"
            >
              {loading ? (
                <CircularProgress size={24} color="inherit" />
              ) : isForgotPassword ? (
                'Send Reset Link'
              ) : isRegistering ? (
                'Create Account'
              ) : (
                'Sign In'
              )}
            </Button>
          </form>

          {!isRegistering && !isForgotPassword && (
            <Box className="w-full space-y-2 mt-3">
              <Button
                fullWidth
                variant="outlined"
                onClick={handleGoogleLogin}
                disabled={loading}
                className="border border-[#D4AF37]/30 hover:border-[#D4AF37] hover:bg-[#D4AF37]/5 text-white py-2.5 font-bold tracking-wider flex items-center justify-center gap-2"
              >
                <Chrome className="w-4.5 h-4.5 text-[#D4AF37]" />
                Sign In with Google (Popup)
              </Button>
              <Button
                fullWidth
                variant="outlined"
                onClick={handleGoogleLoginRedirect}
                disabled={loading}
                className="border border-[#D4AF37]/30 hover:border-[#D4AF37] hover:bg-[#D4AF37]/5 text-white py-2.5 font-bold tracking-wider flex items-center justify-center gap-2"
              >
                <Chrome className="w-4.5 h-4.5 text-[#AA7C11]" />
                Sign In with Google (Redirect)
              </Button>
            </Box>
          )}

          {/* Toggle Register/Login/Forgot Password */}
          <Box className="mt-4 text-center w-full">
            {isForgotPassword ? (
              <Button
                variant="text"
                color="primary"
                onClick={() => {
                  setIsForgotPassword(false);
                  setIsRegistering(false);
                  setError(null);
                  setSuccessMessage(null);
                }}
                className="font-bold text-xs"
                size="small"
              >
                Back to Sign In
              </Button>
            ) : (
              <Box className="flex flex-col items-center gap-1">
                <Typography variant="body2" className="text-gray-400">
                  {isRegistering ? 'Already have an account?' : 'Need a studio account?'}
                  <Button
                    variant="text"
                    color="primary"
                    onClick={() => {
                      setIsRegistering(!isRegistering);
                      setIsForgotPassword(false);
                      setError(null);
                      setSuccessMessage(null);
                    }}
                    className="font-bold ml-1 text-xs"
                    size="small"
                  >
                    {isRegistering ? 'Sign In' : 'Register Here'}
                  </Button>
                </Typography>
                
                {!isRegistering && (
                  <Button
                    variant="text"
                    color="primary"
                    onClick={() => {
                      setIsForgotPassword(true);
                      setError(null);
                      setSuccessMessage(null);
                    }}
                    className="font-semibold text-xs opacity-80 hover:opacity-100 mt-1"
                    size="small"
                  >
                    Forgot Password?
                  </Button>
                )}
              </Box>
            )}
          </Box>

        </CardContent>
      </Card>
    </Box>
  );
};
