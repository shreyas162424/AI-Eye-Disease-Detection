import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, Upload, BarChart3, Shield, Zap, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useLanguage } from '@/contexts/LanguageContext';

const Home = () => {
  const { t } = useLanguage();

  const features = [
    {
      icon: Eye,
      title: "AI-Powered Detection",
      description: "Advanced machine learning algorithms analyze retinal images with 95%+ accuracy"
    },
    {
      icon: Zap,
      title: "Instant Results",
      description: "Get comprehensive analysis results in seconds, not days"
    },
    {
      icon: Shield,
      title: "Medical Grade",
      description: "Validated by ophthalmologists and tested on thousands of images"
    },
    {
      icon: Globe,
      title: "Multi-Language",
      description: "Available in 6 languages to serve diverse communities"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Hero Section */}
      <section className="relative px-6 pt-16 pb-20 mx-auto max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center space-y-8"
        >
          <div className="space-y-4">
            <motion.div
              initial={{ scale: 0.5 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="mx-auto h-20 w-20 rounded-full bg-gradient-primary flex items-center justify-center shadow-medical"
            >
              <Eye className="h-10 w-10 text-white" />
            </motion.div>
            
            <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-foreground via-primary to-primary-soft bg-clip-text text-transparent">
              AI Eye Disease Detection
            </h1>
            
            <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto">
              Advanced artificial intelligence to detect cataracts, glaucoma, and diabetic retinopathy 
              from retinal images in seconds
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button variant="medical" size="lg" asChild className="text-lg px-8 py-6">
              <Link to="/upload">
                <Upload className="h-5 w-5 mr-2" />
                Start Analysis
              </Link>
            </Button>
            
            <Button variant="outline" size="lg" asChild className="text-lg px-8 py-6">
              <Link to="/doctors">
                <BarChart3 className="h-5 w-5 mr-2" />
                View Demo Results
              </Link>
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto pt-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="text-center p-6 rounded-lg bg-success/10 border border-success/20"
            >
              <div className="text-3xl font-bold text-success">95%+</div>
              <div className="text-gray-800 dark:text-gray-200 font-medium">
  Detection Accuracy
</div>

            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="text-center p-6 rounded-lg bg-primary/10 border border-primary/20"
            >
              <div className="text-3xl font-bold text-primary">&lt; 30s</div>
              <div className="text-gray-800 dark:text-gray-200 font-medium">Analysis Time</div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="text-center p-6 rounded-lg bg-warning/10 border border-warning/20"
            >
              <div className="text-3xl font-bold text-warning">3</div>
              <div className="text-gray-800 dark:text-gray-200 font-medium">Disease Types</div>
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section className="px-6 py-20 mx-auto max-w-7xl">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center space-y-12"
        >
          <div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Revolutionizing Eye Care with AI
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Our advanced system combines cutting-edge machine learning with medical expertise 
              to provide accurate, instant eye disease detection
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className="h-full hover:shadow-medical transition-all duration-300 hover:-translate-y-1 border-border/50">
                  <CardHeader className="text-center pb-4">
                    <div className="mx-auto h-12 w-12 rounded-lg bg-gradient-primary flex items-center justify-center mb-4">
                      <feature.icon className="h-6 w-6 text-white" />
                    </div>
                    <CardTitle className="text-lg">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-center text-sm leading-relaxed">
                      {feature.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* CTA Section */}
      <section className="px-6 py-20 mx-auto max-w-7xl">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <Card className="bg-gradient-primary text-white border-0 shadow-medical">
            <CardContent className="p-12 text-center space-y-6">
              <h3 className="text-3xl md:text-4xl font-bold">
                Ready to Analyze Your Eye Health?
              </h3>
              <p className="text-xl opacity-90 max-w-2xl mx-auto">
                Upload your retinal image and get instant AI-powered analysis. 
                Early detection can prevent vision loss and improve treatment outcomes.
              </p>
              <Button 
                variant="secondary" 
                size="lg" 
                asChild 
                className="text-lg px-8 py-6 bg-white text-primary hover:bg-white/90"
              >
                <Link to="/upload">
                  <Upload className="h-5 w-5 mr-2" />
                  Upload Image Now
                </Link>
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </section>
    </div>
  );
};

export default Home;