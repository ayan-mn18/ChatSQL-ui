import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';

export default function SettingsPage() {
  return (
    <div className="p-4 md:p-8 space-y-6 md:space-y-8 pb-24 md:pb-8 overflow-y-auto h-full">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">Settings</h1>
        <p className="text-sm md:text-base text-gray-400">Manage your account and application preferences.</p>
      </div>

      <div className="grid gap-4 md:gap-6">
        <Card className="bg-[#273142] border-none shadow-lg">
          <CardHeader>
            <CardTitle className="text-white">Profile Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="name" className="text-gray-300">Display Name</Label>
              <Input id="name" defaultValue="Admin User" className="bg-[#1B2431] border-none text-white focus:ring-1 focus:ring-[#3b82f6]" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email" className="text-gray-300">Email Address</Label>
              <Input id="email" defaultValue="admin@example.com" className="bg-[#1B2431] border-none text-white focus:ring-1 focus:ring-[#3b82f6]" />
            </div>
            <Button className="bg-[#3b82f6] hover:bg-[#2563eb] text-white w-fit">Save Changes</Button>
          </CardContent>
        </Card>

        <Card className="bg-[#273142] border-none shadow-lg">
          <CardHeader>
            <CardTitle className="text-white">Preferences</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-gray-300">Email Notifications</Label>
                <p className="text-sm text-gray-500">Receive emails about your account activity.</p>
              </div>
              <Switch />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-gray-300">Dark Mode</Label>
                <p className="text-sm text-gray-500">Toggle dark mode theme.</p>
              </div>
              <Switch defaultChecked />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
