import React, { useEffect } from 'react';
import './LandingPage.css';

const LandingPage: React.FC = () => {

  useEffect(() => {
    // Smooth scrolling for anchor links
    const handleAnchorClick = (e: Event) => {
      const target = e.target as HTMLAnchorElement;
      if (target.getAttribute('href')?.startsWith('#')) {
        e.preventDefault();
        const targetElement = document.querySelector(target.getAttribute('href')!);
        if (targetElement) {
          targetElement.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
          });
        }
      }
    };

    // Add interactive effects to feature cards
    const addCardEffects = () => {
      document.querySelectorAll('.feature-card').forEach(card => {
        const cardElement = card as HTMLElement;
        
        const handleMouseEnter = () => {
          cardElement.style.transform = 'translateY(-10px) scale(1.02)';
        };
        
        const handleMouseLeave = () => {
          cardElement.style.transform = 'translateY(0) scale(1)';
        };

        cardElement.addEventListener('mouseenter', handleMouseEnter);
        cardElement.addEventListener('mouseleave', handleMouseLeave);

        // Cleanup function
        return () => {
          cardElement.removeEventListener('mouseenter', handleMouseEnter);
          cardElement.removeEventListener('mouseleave', handleMouseLeave);
        };
      });
    };

    document.addEventListener('click', handleAnchorClick);
    addCardEffects();

    return () => {
      document.removeEventListener('click', handleAnchorClick);
    };
  }, []);

  const handleLaunchApp = () => {
    window.location.href = '/app';
  };

  const handleStartAuditing = () => {
    window.location.href = '/app';
  };

  return (
    <div className="landing-page">
      <div className="container">
        <nav>
          <div className="logo">⚡ NovaGuard</div>
          <div className="nav-links">
            <a href="#features">Features</a>
            <a href="#stats">About</a>
            <a href="#contact">Contact</a>
            <button onClick={handleLaunchApp} className="cta-button">Launch App</button>
          </div>
        </nav>

        <section className="hero">
          <h1>Smart Contract Security Made Simple</h1>
          <p>AI-powered security auditing platform for smart contracts. Detect vulnerabilities, optimize gas usage, and ensure your code is production-ready.</p>
          <div className="hero-buttons">
            <button onClick={handleStartAuditing} className="primary-button">Start Auditing</button>
            <a href="#features" className="secondary-button">Learn More</a>
          </div>
        </section>
      </div>

      <section className="features" id="features">
        <div className="container">
          <h2 style={{ textAlign: 'center', fontSize: '2.5rem', marginBottom: '20px' }}>Powerful Features</h2>
          <p style={{ textAlign: 'center', fontSize: '1.2rem', opacity: 0.9, maxWidth: '600px', margin: '0 auto' }}>
            Everything you need to secure your smart contracts and deploy with confidence.
          </p>
          
          <div className="features-grid">
            <div className="feature-card">
              <i className="ri-shield-check-line feature-icon"></i>
              <h3>AI-Powered Analysis</h3>
              <p>Advanced AI models analyze your smart contracts for security vulnerabilities, code quality issues, and optimization opportunities.</p>
            </div>
            <div className="feature-card">
              <i className="ri-speed-line feature-icon"></i>
              <h3>Real-time Validation</h3>
              <p>Get instant feedback as you code with live syntax checking, vulnerability detection, and smart suggestions.</p>
            </div>
            <div className="feature-card">
              <i className="ri-team-line feature-icon"></i>
              <h3>Team Collaboration</h3>
              <p>Work together with your team, share audit results, and manage projects with built-in collaboration tools.</p>
            </div>
            <div className="feature-card">
              <i className="ri-global-line feature-icon"></i>
              <h3>Multi-chain Support</h3>
              <p>Support for Ethereum, Polygon, Arbitrum, Solana, Starknet, Avalanche, and more blockchain networks.</p>
            </div>
            <div className="feature-card">
              <i className="ri-bar-chart-line feature-icon"></i>
              <h3>Comprehensive Reports</h3>
              <p>Detailed security reports with actionable insights, risk assessments, and remediation guidance.</p>
            </div>
            <div className="feature-card">
              <i className="ri-eye-line feature-icon"></i>
              <h3>Contract Monitoring</h3>
              <p>Monitor deployed contracts in real-time for suspicious activity, anomalies, and security threats.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="stats" id="stats">
        <div className="container">
          <h2 style={{ fontSize: '2.5rem', marginBottom: '20px' }}>Trusted by Developers</h2>
          <p style={{ fontSize: '1.2rem', opacity: 0.9 }}>Join thousands of developers securing their smart contracts with NovaGuard.</p>
          
          <div className="stats-grid">
            <div className="stat-item">
              <h3>10,000+</h3>
              <p>Contracts Audited</p>
            </div>
            <div className="stat-item">
              <h3>500+</h3>
              <p>Vulnerabilities Found</p>
            </div>
            <div className="stat-item">
              <h3>99.9%</h3>
              <p>Uptime</p>
            </div>
            <div className="stat-item">
              <h3>24/7</h3>
              <p>Support</p>
            </div>
          </div>
        </div>
      </section>

      <footer id="contact">
        <div className="container">
          <div className="footer-content">
            <div className="logo">⚡ NovaGuard</div>
            <div className="footer-links">
              <button onClick={handleLaunchApp}>App</button>
              <a href="https://github.com/Sagexd08/NovaGuard">GitHub</a>
              <a href="mailto:contact@novaguard.dev">Contact</a>
            </div>
            <p style={{ opacity: 0.8 }}>&copy; 2024 NovaGuard. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
