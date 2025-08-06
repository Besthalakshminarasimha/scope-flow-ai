import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Eye, Brain, Zap, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const Welcome = () => {
  const navigate = useNavigate();
  const [activeFeature, setActiveFeature] = useState(0);

  const features = [
    {
      icon: Eye,
      title: "Object Detection",
      description: "Identify and locate objects in images with precision",
    },
    {
      icon: Brain,
      title: "AI-Powered Analysis",
      description: "Advanced machine learning models for accurate results",
    },
    {
      icon: Zap,
      title: "Real-time Processing",
      description: "Get instant results with lightning-fast processing",
    },
    {
      icon: Shield,
      title: "Secure & Private",
      description: "Your data is processed securely and never stored",
    },
  ];

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-secondary/10" />
      <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/20 rounded-full blur-3xl animate-float" />
      <div className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-secondary/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />

      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6">
        {/* Hero Section */}
        <div className="text-center max-w-4xl mx-auto mb-16 animate-slide-up">
          <div className="mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-brand rounded-2xl mb-6 animate-glow">
              <span className="text-white font-bold text-3xl">V</span>
            </div>
            <h1 className="text-6xl font-bold mb-6 bg-gradient-brand bg-clip-text text-transparent">
              Welcome to VisionX
            </h1>
            <p className="text-xl text-foreground-muted mb-8 leading-relaxed">
              Experience the power of AI Computer Vision. Analyze images, detect objects,
              recognize faces, and extract text with cutting-edge machine learning models.
            </p>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Button
              onClick={() => navigate('/signup')}
              className="btn-primary px-8 py-4 text-lg font-medium"
            >
              Get Started
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
            <Button
              onClick={() => navigate('/login')}
              className="btn-glass px-8 py-4 text-lg font-medium"
            >
              Sign In
            </Button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          {features.map((feature, index) => (
            <Card
              key={index}
              className={`glass cursor-pointer transition-all duration-300 hover:scale-105 ${
                activeFeature === index ? 'ring-2 ring-primary shadow-primary' : ''
              }`}
              onMouseEnter={() => setActiveFeature(index)}
            >
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-gradient-upload rounded-lg flex items-center justify-center mx-auto mb-4">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm text-foreground-muted">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Stats Section */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 text-center max-w-3xl mx-auto">
          <div className="space-y-2">
            <div className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              99.5%
            </div>
            <div className="text-sm text-foreground-muted">Accuracy Rate</div>
          </div>
          <div className="space-y-2">
            <div className="text-3xl font-bold bg-gradient-secondary bg-clip-text text-transparent">
              &lt;1s
            </div>
            <div className="text-sm text-foreground-muted">Processing Time</div>
          </div>
          <div className="space-y-2">
            <div className="text-3xl font-bold bg-gradient-brand bg-clip-text text-transparent">
              100K+
            </div>
            <div className="text-sm text-foreground-muted">Images Analyzed</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Welcome;