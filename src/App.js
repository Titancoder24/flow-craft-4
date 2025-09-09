import React, { useState, useEffect } from 'react';
import './App.css';

// API Configuration - Hardcoded for easy deployment
const API_KEY = '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';
const API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const MODEL = 'x-ai/grok-code-fast-1';

function App() {
  const [currentStep, setCurrentStep] = useState('prompt');
  const [appIdea, setAppIdea] = useState('');
  const [appType, setAppType] = useState('Mobile App');
  const [designStyle, setDesignStyle] = useState('Modern & Minimal');
  const [progress, setProgress] = useState(0);
  const [generatedScreens, setGeneratedScreens] = useState([]);
  const [flowData, setFlowData] = useState(null);
  const [error, setError] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentPhase, setCurrentPhase] = useState('');
  const [hoveredCard, setHoveredCard] = useState(null);


  const callGrokAPI = async (prompt) => {
    console.log('Making API call to OpenRouter...');
    console.log('API Key:', API_KEY.substring(0, 10) + '...');
    console.log('Model:', MODEL);
    console.log('Prompt length:', prompt.length);
    
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${API_KEY}`,
          'HTTP-Referer': 'https://flowcraft-ai.vercel.app',
          'X-Title': 'FlowCraft AI',
          'User-Agent': 'FlowCraft-AI/1.0'
        },
        body: JSON.stringify({
          model: MODEL,
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.7,
          max_tokens: 2000,
          stream: false
        })
      });

      console.log('API Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error Response:', errorText);
        
        if (response.status === 401) {
          throw new Error('Authentication failed. Please check your API key. Get a new key from https://openrouter.ai/keys');
        } else if (response.status === 429) {
          throw new Error('Rate limit exceeded. Please try again later.');
        } else if (response.status === 400) {
          throw new Error('Invalid request. Please check your input.');
        } else {
          throw new Error(`API Error: ${response.status} - ${errorText}`);
        }
      }

      const data = await response.json();
      console.log('API Response data:', data);
      
      if (!data.choices || !data.choices[0] || !data.choices[0].message) {
        console.error('Invalid API response structure:', data);
        throw new Error('Invalid API response structure');
      }
      
      return data.choices[0].message.content;
    } catch (error) {
      console.error('Fetch error:', error);
      throw error;
    }
  };

  const generateAppFlow = async () => {
    if (!appIdea.trim()) {
      setError('Please describe your app idea first!');
      return;
    }

    console.log('Starting generation...');
    setCurrentStep('loading');
    setError(null);
    setIsGenerating(true);
    setProgress(10);
    setCurrentPhase('Analyzing your vision...');

    try {
      // Step 1: Generate app flow structure
      const flowPrompt = `You are an expert app designer. Create a complete app flow for this idea:

APP IDEA: ${appIdea}
TYPE: ${appType}
STYLE: ${designStyle}

Generate a JSON response with this structure:
{
  "appName": "Creative app name",
  "description": "Brief app description",
  "screens": [
    {
      "name": "Screen name",
      "type": "onboarding/main/detail/etc",
      "description": "What this screen does",
      "elements": ["Button", "Header", "Card", "etc"]
    }
  ]
}

Create 4-6 key screens that make sense for this app. Make it realistic and useful.`;

      setCurrentPhase('Crafting app architecture...');
      const flowResponse = await callGrokAPI(flowPrompt);
      setProgress(30);

      let parsedFlowData;
      try {
        // Clean the response and parse JSON
        const cleanResponse = flowResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        parsedFlowData = JSON.parse(cleanResponse);
        console.log('Flow data:', parsedFlowData);
      } catch (e) {
        console.error('JSON parse error:', e);
        throw new Error('Failed to parse flow data');
      }

      setProgress(50);
      setCurrentPhase('Designing beautiful interfaces...');

      // Step 2: Generate UI for each screen
      const screenPromises = parsedFlowData.screens.map(async (screen, index) => {
        console.log(`Generating UI for screen: ${screen.name}`);
        
        const uiPrompt = `Create a beautiful ${appType} screen UI with ${designStyle} design.

SCREEN: ${screen.name}
DESCRIPTION: ${screen.description}
ELEMENTS: ${screen.elements.join(', ')}

Generate clean HTML with Tailwind CSS. Make it modern and beautiful.
Include realistic content, proper spacing, and ${designStyle} styling.

Return ONLY the HTML code, no explanations:`;

        const screenHTML = await callGrokAPI(uiPrompt);
        setProgress(50 + ((index + 1) / parsedFlowData.screens.length) * 40);
        setCurrentPhase(`Creating screen ${index + 1} of ${parsedFlowData.screens.length}...`);

        return {
          ...screen,
          html: screenHTML.replace(/```html\n?/g, '').replace(/```\n?/g, '').trim()
        };
      });

      const screens = await Promise.all(screenPromises);
      setProgress(100);
      setCurrentPhase('Finalizing your masterpiece...');

      // Show results
      setFlowData(parsedFlowData);
      setGeneratedScreens(screens);
      setCurrentStep('results');
      setIsGenerating(false);
    } catch (error) {
      console.error('Generation failed:', error);
      setError(error.message);
      setCurrentStep('prompt');
      setIsGenerating(false);
    }
  };

  const viewFullScreen = (index) => {
    const screen = generatedScreens[index];
    const newWindow = window.open('', '_blank', 'width=400,height=800');
    newWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>${screen.name} - Full Screen</title>
        <script src="https://cdn.tailwindcss.com"></script>
      </head>
      <body>
        ${screen.html}
      </body>
      </html>
    `);
  };

  const exportScreens = () => {
    if (generatedScreens.length === 0) return;
    
    let exportHTML = '<!DOCTYPE html><html><head><title>Generated App Flow</title><script src="https://cdn.tailwindcss.com"></script></head><body>';
    
    generatedScreens.forEach((screen, i) => {
      exportHTML += `<div style="page-break-after: always;"><h2>Screen ${i + 1}: ${screen.name}</h2>${screen.html}</div>`;
    });
    
    exportHTML += '</body></html>';
    
    const blob = new Blob([exportHTML], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'app-flow.html';
    a.click();
    URL.revokeObjectURL(url);
  };

  const startNewFlow = () => {
    setCurrentStep('prompt');
    setAppIdea('');
    setGeneratedScreens([]);
    setFlowData(null);
    setError(null);
    setProgress(0);
    setIsGenerating(false);
    setCurrentPhase('');
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-blue-50 to-white relative text-black overflow-x-hidden">
      {/* Top Fade Grid Background */}
      <div
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: `
            linear-gradient(to right, #e2e8f0 1px, transparent 1px),
            linear-gradient(to bottom, #e2e8f0 1px, transparent 1px)
          `,
          backgroundSize: "20px 30px",
          WebkitMaskImage:
            "radial-gradient(ellipse 70% 60% at 50% 0%, #000 60%, transparent 100%)",
          maskImage:
            "radial-gradient(ellipse 70% 60% at 50% 0%, #000 60%, transparent 100%)",
        }}
      />
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-white/90 backdrop-blur-xl border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-black rounded-lg flex items-center justify-center group cursor-pointer transition-all duration-300 hover:scale-110">
                <div className="w-6 h-6 bg-white rounded-sm flex items-center justify-center">
                  <div className="w-3 h-3 bg-black rounded-sm"></div>
                </div>
              </div>
              <div>
                <h1 className="text-2xl font-black tracking-tight text-black">FlowCraft</h1>
                <p className="text-xs text-gray-600 font-medium">AI Design Studio</p>
              </div>
            </div>
            <div className="hidden md:flex items-center space-x-6">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-gray-700 font-medium">AI Ready</span>
              </div>
            </div>
          </div>
        </div>
      </nav>


      {/* Main Content */}
      <div className="pt-24 min-h-screen relative z-10">
        {/* Step 1: Initial Prompt */}
        {currentStep === 'prompt' && (
          <div className="max-w-6xl mx-auto px-6 py-16">
            <div className="text-center mb-20">
              <div className="inline-flex items-center justify-center w-24 h-24 bg-black rounded-2xl mb-8 group cursor-pointer transition-all duration-500 hover:scale-110 hover:rotate-3">
                <svg className="w-12 h-12 text-white group-hover:scale-110 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h1 className="text-7xl md:text-8xl font-black mb-8 tracking-tight leading-none text-black">
                Design apps in seconds
              </h1>
              <p className="text-2xl text-gray-600 mb-12 max-w-3xl mx-auto leading-relaxed font-light">
                Generate beautiful app mockups with AI and iterate on your ideas instantly
              </p>
            </div>

            <div className="bg-white rounded-3xl p-12 shadow-2xl border border-gray-200">
              <div className="flex items-center mb-10">
                <div className="w-16 h-16 bg-black rounded-2xl flex items-center justify-center mr-6">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </div>
                <h2 className="text-4xl font-black text-black">What's Your Vision?</h2>
              </div>
              
              <div className="space-y-8">
                <div>
                  <label className="block text-sm font-bold text-black mb-4 uppercase tracking-wider">App Concept</label>
                  <textarea 
                    value={appIdea}
                    onChange={(e) => setAppIdea(e.target.value)}
                    placeholder="Describe your app idea in detail... e.g., A fitness tracking app for runners with personalized workout plans, progress analytics, social challenges, and achievement badges"
                    className="w-full bg-gray-50 rounded-2xl p-8 text-black placeholder-gray-500 border-2 border-gray-200 focus:border-black focus:outline-none resize-none h-40 text-lg leading-relaxed transition-all duration-300 hover:bg-gray-100 focus:bg-white font-medium"
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-8">
                  <div>
                    <label className="block text-sm font-bold text-black mb-4 uppercase tracking-wider">Platform</label>
                    <div className="relative">
                      <select 
                        value={appType}
                        onChange={(e) => setAppType(e.target.value)}
                        className="w-full bg-gray-50 rounded-2xl px-8 py-6 border-2 border-gray-200 focus:border-black focus:outline-none text-black appearance-none cursor-pointer transition-all duration-300 hover:bg-gray-100 focus:bg-white font-medium text-lg"
                      >
                        <option className="bg-white text-black">Mobile App</option>
                        <option className="bg-white text-black">Web App</option>
                        <option className="bg-white text-black">SaaS Dashboard</option>
                        <option className="bg-white text-black">E-commerce</option>
                      </select>
                      <div className="absolute inset-y-0 right-0 flex items-center pr-8 pointer-events-none">
                        <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-black mb-4 uppercase tracking-wider">Style</label>
                    <div className="relative">
                      <select 
                        value={designStyle}
                        onChange={(e) => setDesignStyle(e.target.value)}
                        className="w-full bg-gray-50 rounded-2xl px-8 py-6 border-2 border-gray-200 focus:border-black focus:outline-none text-black appearance-none cursor-pointer transition-all duration-300 hover:bg-gray-100 focus:bg-white font-medium text-lg"
                      >
                        <option className="bg-white text-black">Modern & Minimal</option>
                        <option className="bg-white text-black">Glassmorphism</option>
                        <option className="bg-white text-black">Dark Theme</option>
                        <option className="bg-white text-black">Colorful & Vibrant</option>
                      </select>
                      <div className="absolute inset-y-0 right-0 flex items-center pr-8 pointer-events-none">
                        <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>

                {error && (
                  <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-6">
                    <div className="flex items-center">
                      <svg className="w-6 h-6 text-red-500 mr-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p className="text-red-700 font-bold">{error}</p>
                    </div>
                  </div>
                )}

                <button 
                  onClick={generateAppFlow}
                  disabled={isGenerating}
                  className="w-full bg-black hover:bg-gray-800 disabled:bg-gray-400 rounded-2xl py-8 font-black text-2xl text-white shadow-2xl transition-all duration-300 transform hover:scale-[1.02] disabled:scale-100 disabled:cursor-not-allowed flex items-center justify-center space-x-4 group"
                >
                  {isGenerating ? (
                    <>
                      <div className="w-8 h-8 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Creating Magic...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-8 h-8 group-hover:rotate-12 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      <span>Generate App Design</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Loading */}
        {currentStep === 'loading' && (
          <div className="max-w-4xl mx-auto px-6 py-16">
            <div className="bg-white rounded-3xl p-16 text-center shadow-2xl border border-gray-200">
              <div className="w-32 h-32 bg-black rounded-3xl mx-auto mb-12 flex items-center justify-center group">
                <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
              </div>
              <h2 className="text-5xl font-black mb-8 text-black">
                AI is Designing
                <span className="loading-dots text-gray-500"></span>
              </h2>
              <p className="text-2xl text-gray-600 mb-12 font-medium">{currentPhase}</p>
              <div className="max-w-2xl mx-auto">
                <div className="bg-gray-200 rounded-full h-4 mb-6">
                  <div 
                    className="bg-black h-4 rounded-full transition-all duration-1000 shadow-lg" 
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
                <p className="text-lg text-gray-500 font-bold">{progress}% Complete</p>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Results */}
        {currentStep === 'results' && (
          <div className="max-w-7xl mx-auto px-6 py-16">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-16">
              <div>
                <h2 className="text-6xl font-black mb-6 text-black">
                  Your Design
                </h2>
                <p className="text-2xl text-gray-600 font-light">Ready for development</p>
              </div>
              <div className="flex flex-wrap gap-4 mt-8 lg:mt-0">
                <button 
                  onClick={startNewFlow}
                  className="px-8 py-4 bg-white hover:bg-gray-100 rounded-2xl text-black font-bold transition-all duration-300 border-2 border-gray-200 hover:border-black flex items-center space-x-3 group"
                >
                  <svg className="w-6 h-6 group-hover:rotate-180 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <span>New Design</span>
                </button>
                <button 
                  onClick={exportScreens}
                  className="px-8 py-4 bg-black hover:bg-gray-800 rounded-2xl text-white font-bold transition-all duration-300 shadow-2xl hover:shadow-3xl flex items-center space-x-3 group"
                >
                  <svg className="w-6 h-6 group-hover:scale-110 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span>Export All</span>
                </button>
              </div>
            </div>

            {/* Generated Screens Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
              {generatedScreens.map((screen, index) => (
                <div 
                  key={index} 
                  className="group bg-white rounded-3xl overflow-hidden shadow-2xl hover:shadow-3xl transition-all duration-500 hover:scale-[1.03] cursor-pointer border border-gray-200"
                  onMouseEnter={() => setHoveredCard(index)}
                  onMouseLeave={() => setHoveredCard(null)}
                >
                  <div className="bg-gray-100 rounded-t-3xl p-4">
                    <iframe 
                      className="w-full h-80 bg-white rounded-2xl shadow-lg" 
                      srcDoc={screen.html}
                      style={{ pointerEvents: 'none' }}
                      title={screen.name}
                    ></iframe>
                  </div>
                  <div className="p-8">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-2xl font-black text-black">{screen.name}</h3>
                      <span className="px-4 py-2 bg-black text-white text-sm font-bold rounded-full">
                        {screen.type}
                      </span>
                    </div>
                    <p className="text-gray-600 mb-6 leading-relaxed font-medium text-lg">{screen.description}</p>
                    <div className="flex flex-wrap gap-2 mb-8">
                      {screen.elements.map((el, i) => (
                        <span key={i} className="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-bold rounded-xl border border-gray-200">
                          {el}
                        </span>
                      ))}
                    </div>
                    <button 
                      onClick={() => viewFullScreen(index)}
                      className="w-full bg-black hover:bg-gray-800 rounded-2xl py-4 text-white font-bold transition-all duration-300 flex items-center justify-center space-x-3 group-hover:scale-105"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      <span>View Full Screen</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Flow Description */}
            {flowData && (
              <div className="bg-white rounded-3xl p-12 shadow-2xl border border-gray-200">
                <div className="flex items-center mb-10">
                  <div className="w-16 h-16 bg-black rounded-2xl flex items-center justify-center mr-6">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h3 className="text-4xl font-black text-black">App Overview</h3>
                </div>
                <div className="text-gray-700">
                  <div className="mb-12">
                    <h4 className="text-3xl font-black text-black mb-6">{flowData.appName}</h4>
                    <p className="text-xl leading-relaxed font-medium">{flowData.description}</p>
                  </div>
                  <div className="grid md:grid-cols-2 gap-12">
                    <div>
                      <h5 className="text-2xl font-black text-black mb-8 flex items-center">
                        <svg className="w-8 h-8 mr-4 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                        Screen Flow
                      </h5>
                      <ol className="space-y-4">
                        {generatedScreens.map((screen, i) => (
                          <li key={i} className="flex items-center space-x-4">
                            <span className="w-12 h-12 bg-black rounded-2xl flex items-center justify-center text-white text-lg font-black">
                              {i + 1}
                            </span>
                            <span className="text-gray-700 font-bold text-lg">{screen.name}</span>
                          </li>
                        ))}
                      </ol>
                    </div>
                    <div>
                      <h5 className="text-2xl font-black text-black mb-8 flex items-center">
                        <svg className="w-8 h-8 mr-4 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Features
                      </h5>
                      <ul className="space-y-4">
                        <li className="flex items-center space-x-4">
                          <div className="w-3 h-3 bg-black rounded-full"></div>
                          <span className="text-gray-700 font-bold text-lg">AI-Powered Design</span>
                        </li>
                        <li className="flex items-center space-x-4">
                          <div className="w-3 h-3 bg-black rounded-full"></div>
                          <span className="text-gray-700 font-bold text-lg">{generatedScreens.length} Custom Screens</span>
                        </li>
                        <li className="flex items-center space-x-4">
                          <div className="w-3 h-3 bg-black rounded-full"></div>
                          <span className="text-gray-700 font-bold text-lg">Tailwind CSS Styling</span>
                        </li>
                        <li className="flex items-center space-x-4">
                          <div className="w-3 h-3 bg-black rounded-full"></div>
                          <span className="text-gray-700 font-bold text-lg">Production-Ready Code</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;