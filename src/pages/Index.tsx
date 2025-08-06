import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to welcome page for first-time users
    // In a real app, you'd check authentication status here
    navigate('/welcome');
  }, [navigate]);

  return null;
};

export default Index;
