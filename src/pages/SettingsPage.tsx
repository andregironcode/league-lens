import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import { Toaster } from '@/components/ui/sonner';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, CheckCircle, RefreshCw, Code, Globe, ServerIcon } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { getApiToken, saveApiToken } from '@/services/tokenService';

interface ApiStatus {
  url: string;
  status: 'loading' | 'success' | 'error';
  message: string;
}

interface SecretStatus {
  name: string;
  exists: boolean;
  lastUpdated?: string;
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
    },
    {
      url: 'Supabase Edge Function',
      status: 'loading',
      message: 'Checking edge function status...'
    }
  ]);
  
  const [apiToken, setApiToken] = useState<string>(() => {
    return getApiToken();
  });

  const [secretStatuses, setSecretStatuses] = useState<SecretStatus[]>([
    { name: 'Video API Access Token', exists: false },
    { name: 'Embed Token', exists: false }
  ]);

  const [isSupabaseConnected, setIsSupabaseConnected] = useState<boolean>(false);

  const checkSupabaseConnection = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('scorebat-api', {
        body: { action: 'status' }
      });

      if (error) {
        console.error('Edge function error:', error);
        setApiStatuses(prev => prev.map(api => 
          api.url.includes('Edge Function') ? {
            ...api,
            status: 'error',
            message: `Edge function error: ${error.message}`
          } : api
        ));
        setIsSupabaseConnected(false);
        return false;
      }

      setIsSupabaseConnected(true);
      
      setApiStatuses(prev => prev.map(api => 
        api.url.includes('Edge Function') ? {
          ...api,
          status: 'success',
          message: 'Edge function is accessible!'
        } : api
      ));

      if (data && data.tokens) {
        setSecretStatuses([
          { 
            name: 'Video API Access Token', 
            exists: data.tokens.videoApiToken || false,
            lastUpdated: data.tokens.videoApiTokenUpdated 
          },
          { 
            name: 'Embed Token', 
            exists: data.tokens.embedToken || false,
            lastUpdated: data.tokens.embedTokenUpdated 
          }
        ]);
      }
      
      return true;
    } catch (err) {
      console.error('Error checking Supabase connection:', err);
      setApiStatuses(prev => prev.map(api => 
        api.url.includes('Edge Function') ? {
          ...api,
          status: 'error',
          message: 'Could not connect to Supabase Edge Function'
        } : api
      ));
      setIsSupabaseConnected(false);
      return false;
    }
  };

  const checkApiStatus = async () => {
    setApiStatuses(prev => prev.map(api => ({
      ...api,
      status: 'loading',
      message: 'Checking access...'
    })));
    
    const supabaseConnected = await checkSupabaseConnection();
    
    if (supabaseConnected) {
      try {
        const { data, error } = await supabase.functions.invoke('scorebat-api', {
          body: { action: 'check' }
        });
        
        if (error) {
          console.error('Edge function error during API check:', error);
          setApiStatuses(prev => prev.map(api => 
            !api.url.includes('Edge Function') ? {
              ...api,
              status: 'error',
              message: `Check failed: ${error.message}`
            } : api
          ));
          return;
        }
        
        if (data) {
          setApiStatuses(prev => prev.map(api => {
            if (api.url.includes('video-api')) {
              return {
                ...api,
                status: data.premium ? 'success' : 'error',
                message: data.premium 
                  ? 'Premium API access successful!' 
                  : 'Premium API access failed. Check your token.'
              };
            } else if (api.url.includes('embed')) {
              return {
                ...api,
                status: data.widget ? 'success' : 'error',
                message: data.widget 
                  ? 'Widget API access successful!' 
                  : 'Widget API access failed.'
              };
            }
            return api;
          }));
          return;
        }
      } catch (err) {
        console.error('Error checking APIs via edge function:', err);
      }
    }
    
    try {
      const token = import.meta.env.VITE_SCOREBAT_API_TOKEN || apiToken;
      const apiResponse = await fetch(`https://www.scorebat.com/video-api/v3/feed?token=${token}`);
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
            message: `API error: ${apiData.error?.text || apiData.error || 'Invalid token or access denied'}`
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
                <ServerIcon className="mr-2 h-5 w-5 text-[#FFC30B]" />
                Supabase Connection
              </CardTitle>
              <CardDescription className="text-gray-400">
                Status of Supabase Edge Function and API secrets
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 mb-6">
                <div className="p-4 rounded-lg bg-[#333333] flex items-start justify-between">
                  <div>
                    <div className="font-medium text-white mb-1 flex items-center">
                      Edge Function Status
                    </div>
                    <div className="text-sm text-gray-400">scorebat-api</div>
                    <div className={`mt-2 text-sm ${
                      apiStatuses.find(api => api.url.includes('Edge Function'))?.status === 'success' 
                        ? 'text-green-400' 
                        : apiStatuses.find(api => api.url.includes('Edge Function'))?.status === 'error'
                          ? 'text-red-400' 
                          : 'text-gray-400'
                    }`}>
                      {apiStatuses.find(api => api.url.includes('Edge Function'))?.message}
                    </div>
                  </div>
                  <div>
                    {apiStatuses.find(api => api.url.includes('Edge Function'))?.status === 'loading' && (
                      <RefreshCw className="h-6 w-6 text-gray-400 animate-spin" />
                    )}
                    {apiStatuses.find(api => api.url.includes('Edge Function'))?.status === 'success' && (
                      <CheckCircle className="h-6 w-6 text-green-400" />
                    )}
                    {apiStatuses.find(api => api.url.includes('Edge Function'))?.status === 'error' && (
                      <AlertCircle className="h-6 w-6 text-red-400" />
                    )}
                  </div>
                </div>
                
                {secretStatuses.map((secret, index) => (
                  <div key={index} className="p-4 rounded-lg bg-[#333333] flex items-start justify-between">
                    <div>
                      <div className="font-medium text-white mb-1 flex items-center">
                        {secret.name}
                      </div>
                      <div className="text-sm text-gray-400">Supabase Secret</div>
                      <div className={`mt-2 text-sm ${secret.exists ? 'text-green-400' : 'text-red-400'}`}>
                        {secret.exists 
                          ? `Secret is set${secret.lastUpdated ? ` (updated: ${secret.lastUpdated})` : ''}` 
                          : 'Secret is not set'}
                      </div>
                    </div>
                    <div>
                      {secret.exists 
                        ? <CheckCircle className="h-6 w-6 text-green-400" />
                        : <AlertCircle className="h-6 w-6 text-red-400" />
                      }
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          
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
              <div className="space-y-4 mb-6">
                {!isSupabaseConnected && (
                  <div className="p-4 rounded-lg bg-[#333333]">
                    <div className="font-medium text-white mb-2">Scorebat API Token</div>
                    <div className="text-sm text-gray-400 mb-3">
                      Enter your Scorebat API token below. You can get one by subscribing to their API service.
                    </div>
                    <div className="flex items-center gap-2">
                      <input 
                        type="text" 
                        value={apiToken}
                        onChange={(e) => setApiToken(e.target.value)}
                        placeholder="Enter your Scorebat API token"
                        className="flex-1 bg-[#1A1A1A] border border-gray-700 rounded px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-[#FFC30B]"
                      />
                      <Button
                        className="bg-[#FFC30B] hover:bg-[#E5AF09] text-black"
                        onClick={() => {
                          saveApiToken(apiToken);
                          window.dispatchEvent(new CustomEvent('scorebat-token-updated', { 
                            detail: { status: 'checking', refresh: true } 
                          }));
                          checkApiStatus();
                          toast.success('API Token Saved', {
                            description: 'Your Scorebat API token has been saved. Testing connection...',
                            duration: 3000
                          });
                        }}
                      >
                        Save Token
                      </Button>
                    </div>
                    <div className="text-xs text-gray-500 mt-2">
                      {import.meta.env.VITE_SCOREBAT_API_TOKEN ? 
                        '✓ API token is set in environment variables' : 
                        'Note: API token set to default value. You can update it above.'}
                    </div>
                  </div>
                )}
              
                {apiStatuses.filter(api => !api.url.includes('Edge Function')).map((api, index) => (
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
                {isSupabaseConnected 
                  ? 'Your API tokens are securely stored in Supabase Edge Functions, providing a secure way to access the Scorebat APIs.'
                  : 'If you\'re seeing errors with the premium API but success with the widget API, the app will automatically use widget data. The application falls back to demo data if no APIs are available.'}
              </p>
              <p className="font-semibold">
                Important: Scorebat API tokens typically start with "MTk" and are quite long. If your token doesn't work, 
                make sure it's copied correctly and includes the full string without any extra spaces.
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
