import { motion } from 'framer-motion';
import { Check, Zap, Sparkles, Building } from 'lucide-react';

const PricingPage = () => {
  const plans = [
    {
      name: "Free",
      price: "$0",
      description: "Perfect for casual users needing basic PDF tools.",
      icon: <Zap className="text-blue-500" size={24} />,
      color: "border-blue-200",
      bg: "bg-white",
      buttonColor: "bg-slate-100 text-slate-800 hover:bg-slate-200",
      features: [
        "Up to 5 conversions per day",
        "Max file size: 10MB",
        "Basic PDF tools (merge, split)",
        "Standard processing speed",
        "Community support"
      ]
    },
    {
      name: "Pro",
      price: "$9.99",
      period: "/month",
      description: "Best for professionals and heavy users requiring AI.",
      icon: <Sparkles className="text-white" size={24} />,
      color: "border-primary-500",
      bg: "bg-gradient-to-br from-primary-600 to-accent-600 text-white",
      buttonColor: "bg-white text-primary-600 hover:bg-slate-50",
      popular: true,
      features: [
        "Unlimited conversions",
        "Unlimited file size",
        "All PDF tools",
        "Advanced AI Assistant",
        "Batch processing",
        "Priority cloud processing",
        "No watermarks",
        "Cloud integrations (Drive, Dropbox)",
        "Priority email support"
      ]
    },
    {
      name: "Business",
      price: "$24.99",
      period: "/month",
      description: "For teams requiring advanced management and security.",
      icon: <Building className="text-purple-500" size={24} />,
      color: "border-purple-200",
      bg: "bg-white",
      buttonColor: "bg-slate-100 text-slate-800 hover:bg-slate-200",
      features: [
        "Everything in Pro",
        "5 Team members included",
        "Centralized billing",
        "Company branding",
        "API access",
        "Dedicated account manager",
        "99.9% uptime SLA"
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 pt-24 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="text-center max-w-3xl mx-auto mb-16">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-6xl font-extrabold text-slate-900 tracking-tight mb-6"
          >
            Transparent AI usage pricing. <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-accent-500">
              No hidden fees.
            </span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-xl text-slate-600"
          >
            Start using our basic tools for free. Upgrade whenever you need the power of AI or batch processing.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * index }}
              className={`rounded-3xl p-8 border ${plan.color} ${plan.bg} ${plan.popular ? 'shadow-2xl shadow-primary-500/20 scale-105 z-10' : 'shadow-sm z-0 relative mt-4'}`}
            >
              {plan.popular && (
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                  <span className="bg-gradient-to-r from-pink-500 to-purple-500 text-white text-xs font-bold uppercase tracking-wider py-1 px-3 rounded-full">
                    Most Popular
                  </span>
                </div>
              )}
              
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-6 ${plan.popular ? 'bg-white/20' : 'bg-slate-100'}`}>
                {plan.icon}
              </div>
              
              <h3 className={`text-2xl font-bold mb-2`}>{plan.name}</h3>
              <p className={`mb-6 ${plan.popular ? 'text-primary-100' : 'text-slate-600'}`}>{plan.description}</p>
              
              <div className="mb-8">
                <span className="text-5xl font-extrabold tracking-tight">{plan.price}</span>
                {plan.period && <span className={`text-lg ml-1 ${plan.popular ? 'text-primary-100' : 'text-slate-500'}`}>{plan.period}</span>}
              </div>
              
              <button className={`w-full py-4 rounded-xl font-bold mb-8 transition-colors ${plan.buttonColor}`}>
                {plan.name === 'Free' ? 'Get Started' : `Upgrade to ${plan.name} →`}
              </button>
              
              <div className="space-y-4">
                {plan.features.map((feature, i) => (
                  <div key={i} className="flex items-start">
                    <Check className={`mt-0.5 mr-3 flex-shrink-0 ${plan.popular ? 'text-primary-200' : 'text-primary-500'}`} size={20} />
                    <span className={plan.popular ? 'text-white' : 'text-slate-700'}>{feature}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>

        <div className="mt-24 text-center">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">Still have questions?</h2>
            <p className="text-slate-600 mb-6">Can't find the answer you're looking for? Our support team is here to help.</p>
            <button className="bg-slate-900 text-white px-6 py-3 rounded-xl font-medium hover:bg-slate-800 transition-colors">
              Contact Support
            </button>
        </div>

      </div>
    </div>
  );
};

export default PricingPage;
