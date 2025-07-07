import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ShiftForm from '@/components/ShiftForm';
import OCRUpload from '@/components/OCRUpload';
import { useShifts } from '@/hooks/useShifts';
import { useClientProfiles } from '@/hooks/useClientProfiles';
import { useNameAnonymization } from '@/hooks/useNameAnonymization';
import { ShiftFormData } from '@/types/shift';
import { useToast } from '@/hooks/use-toast';
import { Edit, Upload } from 'lucide-react';

const AddShift = () => {
  const navigate = useNavigate();
  const { addShift, settings } = useShifts();
  const { saveClientProfile } = useClientProfiles();
  const { anonymizeName } = useNameAnonymization();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('manual');

  const handleManualSubmit = async (data: ShiftFormData) => {
    try {
      // Store original name for client profile mapping
      const originalClientName = data.clientName;
      
      // Anonymize the client name for display and storage
      const anonymizedData = {
        ...data,
        clientName: anonymizeName(originalClientName)
      };
      
      const newShift = await addShift(anonymizedData);
      
      // Save client-location mapping using original name
      if (data.location && settings.autoSaveClientLocations) {
        await saveClientProfile(originalClientName, data.location);
      }
      
      toast({
        title: "Shift added successfully",
        description: `Added shift for ${anonymizedData.clientName} on ${new Date(newShift.date).toLocaleDateString()}`,
      });

      navigate('/');
    } catch (error) {
      toast({
        title: "Failed to add shift",
        description: "There was an error adding your shift. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Add New Shift</h1>
        <p className="text-muted-foreground mt-1">
          Add shifts manually or upload a rota image to extract multiple shifts
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="manual" className="flex items-center gap-2">
            <Edit className="w-4 h-4" />
            Manual Entry
          </TabsTrigger>
          <TabsTrigger value="upload" className="flex items-center gap-2">
            <Upload className="w-4 h-4" />
            Upload & Extract
          </TabsTrigger>
        </TabsList>

        <TabsContent value="manual" className="mt-6">
          <ShiftForm onSubmit={handleManualSubmit} />
        </TabsContent>

        <TabsContent value="upload" className="mt-6">
          <OCRUpload />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AddShift;