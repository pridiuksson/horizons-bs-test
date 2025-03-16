import React, { useState } from "react";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { signIn, signUp } from "@/lib/auth";
import { useToast } from "@/components/ui/use-toast";

const AuthForm = ({ onSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { data, error } = isLogin
        ? await signIn(email, password)
        : await signUp(email, password);

      if (error) throw error;

      // Validate response data
      if (!data || !data.user) {
        throw new Error('Invalid response from authentication service');
      }

      // For signup, check if email confirmation is required
      if (!isLogin && !data.session) {
        toast({
          title: "Success",
          description: "Please check your email to confirm your account",
        });
        return;
      }

      toast({
        title: "Success",
        description: isLogin ? "Signed in successfully" : "Account created successfully",
      });

      onSuccess({ session: data.session, user: data.user });
    } catch (error) {
      console.error('Authentication error:', error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-md mx-auto bg-white p-8 rounded-lg shadow-lg"
    >
      <h2 className="text-2xl font-bold text-center mb-6">
        {isLogin ? "Sign In" : "Create Account"}
      </h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={isLoading}
          />
        </div>
        <div>
          <Input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={isLoading}
            minLength={6}
          />
        </div>
        <Button
          type="submit"
          className="w-full"
          disabled={isLoading}
        >
          {isLoading
            ? "Loading..."
            : isLogin
            ? "Sign In"
            : "Sign Up"}
        </Button>
      </form>
      <div className="mt-4 text-center">
        <button
          onClick={() => setIsLogin(!isLogin)}
          className="text-sm text-blue-500 hover:text-blue-600"
          disabled={isLoading}
        >
          {isLogin
            ? "Need an account? Sign Up"
            : "Already have an account? Sign In"}
        </button>
      </div>
    </motion.div>
  );
};

export default AuthForm;