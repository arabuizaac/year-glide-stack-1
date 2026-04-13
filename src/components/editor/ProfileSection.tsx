import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { 
  Share2, Upload, Globe, Lock, Check, AlertCircle, User, Building2,
  Mail, Phone, MapPin, Instagram, Facebook, Linkedin
} from "lucide-react";
import { useAutoSave } from "@/hooks/useAutoSave";

interface ProfileSectionProps {
  userId: string;
}

export const ProfileSection = ({ userId }: ProfileSectionProps) => {
  const [profile, setProfile] = useState({
    username: '',
    display_name: '',
    bio: '',
    avatar_url: '',
    gallery_privacy: 'public',
    is_published: false,
    profile_type: 'personal',
    occupation: '',
    location: '',
    contact_email: '',
    contact_phone: '',
    website: '',
    instagram: '',
    twitter: '',
    linkedin: '',
    facebook: '',
    tiktok: '',
  });
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [hasYears, setHasYears] = useState(false);

  const { triggerSave, isSaving } = useAutoSave();

  useEffect(() => {
    fetchProfile();
    checkYears();
  }, [userId]);

  useEffect(() => {
    if (profile.username) {
      triggerSave(() => updateProfile(profile));
    }
  }, [profile]);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) throw error;
      if (data) {
        setProfile({
          username: data.username || '',
          display_name: data.display_name || '',
          bio: data.bio || '',
          avatar_url: data.avatar_url || '',
          gallery_privacy: data.gallery_privacy || 'public',
          is_published: data.is_published || false,
          profile_type: data.profile_type || 'personal',
          occupation: data.occupation || '',
          location: data.location || '',
          contact_email: data.contact_email || '',
          contact_phone: data.contact_phone || '',
          website: data.website || '',
          instagram: data.instagram || '',
          twitter: data.twitter || '',
          linkedin: data.linkedin || '',
          facebook: data.facebook || '',
          tiktok: data.tiktok || '',
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const checkYears = async () => {
    const { data } = await supabase
      .from('years')
      .select('id')
      .eq('user_id', userId)
      .limit(1);
    
    setHasYears((data?.length || 0) > 0);
  };

  const updateProfile = async (data: typeof profile) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          username: data.username,
          display_name: data.display_name,
          bio: data.bio,
          avatar_url: data.avatar_url,
          gallery_privacy: data.gallery_privacy,
          profile_type: data.profile_type,
          occupation: data.occupation,
          location: data.location,
          contact_email: data.contact_email,
          contact_phone: data.contact_phone,
          website: data.website,
          instagram: data.instagram,
          twitter: data.twitter,
          linkedin: data.linkedin,
          facebook: data.facebook,
          tiktok: data.tiktok,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);

      if (error) throw error;
    } catch (error: any) {
      console.error('Error updating profile:', error);
      if (error.code === '23505') {
        toast.error('Username already taken');
      } else {
        toast.error('Failed to update profile');
      }
      throw error;
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    setUploading(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}_avatar_${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('vision-swipe-media')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('vision-swipe-media')
        .getPublicUrl(fileName);

      setProfile(prev => ({ ...prev, avatar_url: publicUrl }));
      await updateProfile({ ...profile, avatar_url: publicUrl });
      toast.success('Avatar uploaded');
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast.error('Failed to upload avatar');
    } finally {
      setUploading(false);
    }
  };

  const handleShare = () => {
    const url = `${window.location.origin}/u/${profile.username}`;
    
    if (navigator.share) {
      navigator.share({
        title: `${profile.display_name || profile.username}'s Timeline on VisionSwipe`,
        url: url
      }).catch(() => {
        navigator.clipboard.writeText(url);
        toast.success('Gallery link copied!');
      });
    } else {
      navigator.clipboard.writeText(url);
      toast.success('Gallery link copied!');
    }
  };

  if (loading) {
    return <div className="p-6">Loading profile...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Public Profile</h2>
        <Button onClick={handleShare} variant="outline" size="sm">
          <Share2 className="mr-2 h-4 w-4" />
          Share Gallery
        </Button>
      </div>

      {/* Publish Status Card */}
      <Card className={`p-4 ${profile.is_published ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'}`}>
        <div className="flex items-center gap-3">
          {profile.is_published ? (
            <>
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                <Check className="w-5 h-5 text-green-600" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-green-800">Timeline Published</p>
                <p className="text-sm text-green-600">
                  {profile.gallery_privacy === 'public' 
                    ? 'Your timeline is live and visible to everyone'
                    : 'Your timeline is published but only accessible via direct link'}
                </p>
              </div>
              <div className="flex items-center gap-1 text-sm text-green-600">
                {profile.gallery_privacy === 'public' ? <Globe className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                {profile.gallery_privacy === 'public' ? 'Public' : 'Private'}
              </div>
            </>
          ) : (
            <>
              <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-amber-600" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-amber-800">Not Published Yet</p>
                <p className="text-sm text-amber-600">
                  {hasYears 
                    ? 'Click "Publish" in the bottom bar to go live'
                    : 'Add at least one year, then click "Publish" to go live'}
                </p>
              </div>
            </>
          )}
        </div>
      </Card>

      {/* Profile Type Selector */}
      <Card className="p-6">
        <Label className="text-base font-semibold mb-4 block">Profile Type</Label>
        <div className="flex gap-4">
          <button
            onClick={() => setProfile(prev => ({ ...prev, profile_type: 'personal' }))}
            className={`flex-1 p-4 rounded-xl border-2 transition-all ${
              profile.profile_type === 'personal' 
                ? 'border-primary bg-primary/5' 
                : 'border-neutral-200 hover:border-neutral-300'
            }`}
          >
            <User className={`w-6 h-6 mx-auto mb-2 ${profile.profile_type === 'personal' ? 'text-primary' : 'text-neutral-400'}`} />
            <p className={`font-medium ${profile.profile_type === 'personal' ? 'text-primary' : 'text-neutral-600'}`}>Personal</p>
            <p className="text-xs text-neutral-500 mt-1">For individuals</p>
          </button>
          <button
            onClick={() => setProfile(prev => ({ ...prev, profile_type: 'business' }))}
            className={`flex-1 p-4 rounded-xl border-2 transition-all ${
              profile.profile_type === 'business' 
                ? 'border-primary bg-primary/5' 
                : 'border-neutral-200 hover:border-neutral-300'
            }`}
          >
            <Building2 className={`w-6 h-6 mx-auto mb-2 ${profile.profile_type === 'business' ? 'text-primary' : 'text-neutral-400'}`} />
            <p className={`font-medium ${profile.profile_type === 'business' ? 'text-primary' : 'text-neutral-600'}`}>Business</p>
            <p className="text-xs text-neutral-500 mt-1">For companies</p>
          </button>
        </div>
      </Card>

      <Card className="p-6 space-y-6">
        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="contact">Contact</TabsTrigger>
            <TabsTrigger value="social">Social Links</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-6 mt-6">
            {/* Avatar */}
            <div className="space-y-2">
              <Label>Avatar / Logo</Label>
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-white font-bold text-2xl overflow-hidden">
                  {profile.avatar_url ? (
                    <img
                      src={profile.avatar_url}
                      alt="Avatar"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    profile.display_name?.[0]?.toUpperCase() || profile.username[0]?.toUpperCase()
                  )}
                </div>
                <div>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    disabled={uploading}
                    className="hidden"
                    id="avatar-upload"
                  />
                  <Label htmlFor="avatar-upload">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={uploading}
                      asChild
                    >
                      <span className="cursor-pointer">
                        <Upload className="mr-2 h-4 w-4" />
                        {uploading ? 'Uploading...' : 'Upload'}
                      </span>
                    </Button>
                  </Label>
                </div>
              </div>
            </div>

            {/* Username */}
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                value={profile.username}
                onChange={(e) => setProfile(prev => ({ ...prev, username: e.target.value }))}
                placeholder="your-username"
              />
              <p className="text-xs text-muted-foreground">
                Your gallery URL: {window.location.origin}/u/{profile.username}
              </p>
            </div>

            {/* Display Name */}
            <div className="space-y-2">
              <Label htmlFor="display_name">
                {profile.profile_type === 'business' ? 'Business Name' : 'Display Name'}
              </Label>
              <Input
                id="display_name"
                value={profile.display_name}
                onChange={(e) => setProfile(prev => ({ ...prev, display_name: e.target.value }))}
                placeholder={profile.profile_type === 'business' ? 'Your Company' : 'John Doe'}
              />
            </div>

            {/* Occupation/Industry */}
            <div className="space-y-2">
              <Label htmlFor="occupation">
                {profile.profile_type === 'business' ? 'Industry' : 'Occupation'}
              </Label>
              <Input
                id="occupation"
                value={profile.occupation}
                onChange={(e) => setProfile(prev => ({ ...prev, occupation: e.target.value }))}
                placeholder={profile.profile_type === 'business' ? 'Technology, Finance, etc.' : 'Software Engineer, Designer, etc.'}
              />
            </div>

            {/* Bio */}
            <div className="space-y-2">
              <Label htmlFor="bio">
                {profile.profile_type === 'business' ? 'About / Description' : 'Bio'}
              </Label>
              <Textarea
                id="bio"
                value={profile.bio}
                onChange={(e) => setProfile(prev => ({ ...prev, bio: e.target.value }))}
                placeholder={profile.profile_type === 'business' ? 'Tell people about your business...' : 'Tell people about yourself...'}
                rows={3}
              />
            </div>
          </TabsContent>

          <TabsContent value="contact" className="space-y-6 mt-6">
            {/* Location */}
            <div className="space-y-2">
              <Label htmlFor="location" className="flex items-center gap-2">
                <MapPin className="w-4 h-4" /> Location
              </Label>
              <Input
                id="location"
                value={profile.location}
                onChange={(e) => setProfile(prev => ({ ...prev, location: e.target.value }))}
                placeholder="City, Country"
              />
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="contact_email" className="flex items-center gap-2">
                <Mail className="w-4 h-4" /> Contact Email
              </Label>
              <Input
                id="contact_email"
                type="email"
                value={profile.contact_email}
                onChange={(e) => setProfile(prev => ({ ...prev, contact_email: e.target.value }))}
                placeholder="contact@example.com"
              />
            </div>

            {/* Phone */}
            <div className="space-y-2">
              <Label htmlFor="contact_phone" className="flex items-center gap-2">
                <Phone className="w-4 h-4" /> Contact Phone
              </Label>
              <Input
                id="contact_phone"
                type="tel"
                value={profile.contact_phone}
                onChange={(e) => setProfile(prev => ({ ...prev, contact_phone: e.target.value }))}
                placeholder="+1 (555) 123-4567"
              />
            </div>

            {/* Website */}
            <div className="space-y-2">
              <Label htmlFor="website" className="flex items-center gap-2">
                <Globe className="w-4 h-4" /> Website
              </Label>
              <Input
                id="website"
                type="url"
                value={profile.website}
                onChange={(e) => setProfile(prev => ({ ...prev, website: e.target.value }))}
                placeholder="https://yourwebsite.com"
              />
            </div>
          </TabsContent>

          <TabsContent value="social" className="space-y-6 mt-6">
            {/* Instagram */}
            <div className="space-y-2">
              <Label htmlFor="instagram" className="flex items-center gap-2">
                <Instagram className="w-4 h-4" /> Instagram
              </Label>
              <Input
                id="instagram"
                value={profile.instagram}
                onChange={(e) => setProfile(prev => ({ ...prev, instagram: e.target.value }))}
                placeholder="https://instagram.com/username"
              />
            </div>

            {/* Twitter */}
            <div className="space-y-2">
              <Label htmlFor="twitter" className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
                X (Twitter)
              </Label>
              <Input
                id="twitter"
                value={profile.twitter}
                onChange={(e) => setProfile(prev => ({ ...prev, twitter: e.target.value }))}
                placeholder="https://twitter.com/username"
              />
            </div>

            {/* LinkedIn */}
            <div className="space-y-2">
              <Label htmlFor="linkedin" className="flex items-center gap-2">
                <Linkedin className="w-4 h-4" /> LinkedIn
              </Label>
              <Input
                id="linkedin"
                value={profile.linkedin}
                onChange={(e) => setProfile(prev => ({ ...prev, linkedin: e.target.value }))}
                placeholder="https://linkedin.com/in/username"
              />
            </div>

            {/* Facebook */}
            <div className="space-y-2">
              <Label htmlFor="facebook" className="flex items-center gap-2">
                <Facebook className="w-4 h-4" /> Facebook
              </Label>
              <Input
                id="facebook"
                value={profile.facebook}
                onChange={(e) => setProfile(prev => ({ ...prev, facebook: e.target.value }))}
                placeholder="https://facebook.com/username"
              />
            </div>

            {/* TikTok */}
            <div className="space-y-2">
              <Label htmlFor="tiktok" className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z"/>
                </svg>
                TikTok
              </Label>
              <Input
                id="tiktok"
                value={profile.tiktok}
                onChange={(e) => setProfile(prev => ({ ...prev, tiktok: e.target.value }))}
                placeholder="https://tiktok.com/@username"
              />
            </div>
          </TabsContent>
        </Tabs>

        {/* Privacy Toggle */}
        <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg border-t pt-6 mt-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              {profile.gallery_privacy === 'public' ? (
                <Globe className="w-4 h-4 text-green-600" />
              ) : (
                <Lock className="w-4 h-4 text-amber-600" />
              )}
              <Label htmlFor="privacy">Gallery Privacy</Label>
            </div>
            <p className="text-sm text-muted-foreground">
              {profile.gallery_privacy === 'public' 
                ? 'Your gallery is visible in Explore and can be shared'
                : 'Your gallery is private and hidden from Explore'
              }
            </p>
          </div>
          <Switch
            id="privacy"
            checked={profile.gallery_privacy === 'public'}
            onCheckedChange={(checked) => 
              setProfile(prev => ({ ...prev, gallery_privacy: checked ? 'public' : 'private' }))
            }
          />
        </div>

        {isSaving && (
          <p className="text-sm text-muted-foreground">Saving changes...</p>
        )}
      </Card>
    </div>
  );
};
