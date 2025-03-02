
import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import { Toaster } from '@/components/ui/sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, CheckCircle, RefreshCw, Code, Globe } from 'lucide-react';

interface ApiStatus {
  url: string;
  status: 'loading' | 'success' | 'error';
  message: string;
}

const SettingsPage = () => {
  const [apiStatuses, setApiStatuses] = useState<ApiStatus[]>([
    {
      url: 'https://www.scorebat.com/video-api/v3/feed',
      status: 'loading',
      message: 'Checking API access...'
    },
    {
      url: 'https://www.scorebat.com/embed/livescore',
      status: 'loading',
      message: 'Checking widget access...'
    }
  ]);

  const checkApiStatus = async () => {
    setApiStatuses(prev => prev.map(api => ({
      ...api,
      status: 'loading',
      message: 'Checking access...'
    })));
    
    // Check the main API status
    try {
      const apiResponse = await fetch('https://www.scorebat.com/video-api/v3/feed?token=MTk1NDQ4X01UazFORFF4WDFBeU9UZzRNRGcwTXpGZk9XTmtOV0kxWXpBeFlXRTBPVGM1WVRrME5URmtOVEV5TkdKaVlqZGpZV0prTURnd016SXlOUT09');
      const apiData = await apiResponse.json();
      
      if (apiResponse.ok && !apiData.error) {
        setApiStatuses(prev => prev.map(api => 
          api.url.includes('video-api') ? {
            ...api,
            status: 'success',
            message: 'API access successful! You have a valid API token.'
          } : api
        ));
      } else {
        setApiStatuses(prev => prev.map(api => 
          api.url.includes('video-api') ? {
            ...api,
            status: 'error',
            message: `API error: ${apiData.error?.text || 'Unknown error'}`
          } : api
        ));
      }
    } catch (error) {
      setApiStatuses(prev => prev.map(api => 
        api.url.includes('video-api') ? {
          ...api,
          status: 'error',
          message: 'Could not connect to API.'
        } : api
      ));
    }
    
    // Check the widget API status
    try {
      const widgetResponse = await fetch('https://www.scorebat.com/embed/livescore?json=1');
      
      if (widgetResponse.ok) {
        const widgetData = await widgetResponse.json();
        const widgetEntries = Array.isArray(widgetData) ? widgetData.length : 0;
        
        setApiStatuses(prev => prev.map(api => 
          api.url.includes('embed') ? {
            ...api,
            status: 'success',
            message: `Widget access successful! Received ${widgetEntries} entries.`
          } : api
        ));
      } else {
        setApiStatuses(prev => prev.map(api => 
          api.url.includes('embed') ? {
            ...api,
            status: 'error',
            message: 'Widget access failed.'
          } : api
        ));
      }
    } catch (error) {
      setApiStatuses(prev => prev.map(api => 
        api.url.includes('embed') ? {
          ...api,
          status: 'error',
          message: 'Could not connect to widget API.'
        } : api
      ));
    }
  };

  useEffect(() => {
    checkApiStatus();
  }, []);

  return (
    <div className="min-h-screen bg-[#111111] text-white">
      <Header />
      <Toaster position="top-center" />
      
      <main className="pt-16 pb-10">
        <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 py-8">
          <h1 className="text-3xl font-bold mb-8">Settings & Diagnostics</h1>
          
          <Card className="bg-[#222222] border-gray-700 mb-8">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Globe className="mr-2 h-5 w-5 text-[#FFC30B]" />
                API Connection Status
              </CardTitle>
              <CardDescription className="text-gray-400">
                Check your connection to the Scorebat API services
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {apiStatuses.map((api, index) => (
                  <div key={index} className="p-4 rounded-lg bg-[#333333] flex items-start justify-between">
                    <div>
                      <div className="font-medium text-white mb-1 flex items-center">
                        {api.url.includes('video-api') ? 'Premium API' : 'Widget API'}
                      </div>
                      <div className="text-sm text-gray-400">{api.url}</div>
                      <div className={`mt-2 text-sm ${
                        api.status === 'success' ? 'text-green-400' : 
                        api.status === 'error' ? 'text-red-400' : 'text-gray-400'
                      }`}>
                        {api.message}
                      </div>
                    </div>
                    <div>
                      {api.status === 'loading' && (
                        <RefreshCw className="h-6 w-6 text-gray-400 animate-spin" />
                      )}
                      {api.status === 'success' && (
                        <CheckCircle className="h-6 w-6 text-green-400" />
                      )}
                      {api.status === 'error' && (
                        <AlertCircle className="h-6 w-6 text-red-400" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                onClick={checkApiStatus} 
                variant="outline" 
                className="w-full bg-[#333333] hover:bg-[#444444] text-white border-gray-700"
              >
                <RefreshCw size={16} className="mr-2" />
                Refresh API Status
              </Button>
            </CardFooter>
          </Card>
          
          <Card className="bg-[#222222] border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Code className="mr-2 h-5 w-5 text-[#FFC30B]" />
                API Notes
              </CardTitle>
              <CardDescription className="text-gray-400">
                Information about Scorebat API usage
              </CardDescription>
            </CardHeader>
            <CardContent className="text-gray-300 space-y-4 text-sm">
              <p>
                The Scorebat API has two access methods:
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li>
                  <strong>Premium API</strong> - Requires a paid subscription to Scorebat's developer plans. 
                  This gives direct access to their video API.
                </li>
                <li>
                  <strong>Widget API</strong> - Free access to embed content. This app is currently 
                  configured to use the widget API if the premium API is unavailable.
                </li>
              </ul>
              <p>
                If you're seeing errors with the premium API but success with the widget API, the app will automatically 
                use widget data. The application falls back to demo data if no APIs are available.
              </p>
            </CardContent>
            <CardFooter>
              <Button 
                onClick={() => window.location.href = '/'} 
                variant="default" 
                className="w-full bg-[#FFC30B] hover:bg-[#E5AF09] text-black"
              >
                Return to Home
              </Button>
            </CardFooter>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default SettingsPage;
