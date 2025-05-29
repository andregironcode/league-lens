import { useState, useEffect } from 'react';
import { setActiveService, getActiveService, ServiceType } from '@/services/serviceAdapter';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';

/**
 * Service Switcher Component
 * 
 * Allows users to switch between different backend service implementations
 * (mock data, Supabase, Highlightly API)
 */
const ServiceSwitcher = () => {
  const [activeService, setCurrentService] = useState<ServiceType>(getActiveService());

  // Handle service change
  const handleServiceChange = (value: string) => {
    const serviceType = value as ServiceType;
    setActiveService(serviceType);
    setCurrentService(serviceType);
    
    toast({
      title: "Service Changed",
      description: `Now using ${serviceType} service as backend`,
      variant: "default",
    });
    
    // Reload the page to refresh data
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  };

  return (
    <div className="service-switcher p-2 bg-gray-800 rounded-md flex items-center gap-2">
      <span className="text-xs text-gray-300">API:</span>
      <Select value={activeService} onValueChange={handleServiceChange}>
        <SelectTrigger className="h-7 w-24 text-xs">
          <SelectValue placeholder="Select API" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="mock">Mock Data</SelectItem>
          <SelectItem value="supabase">Supabase</SelectItem>
          <SelectItem value="highlightly">Highlightly</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};

export default ServiceSwitcher;
