/**
 * AUTORS: VIESTURS IVANCOVS
 * DATNE: PROFILE.TSX - LIETOTĀJA PROFILA LAPAS KOMPONENTE
 * APRAKSTS: LIETOTĀJA PROFILA INFORMĀCIJAS APSKATE UN REDIĢĒŠANA,
 *           IETVER LIETOTĀJVĀRDA MAIŅU UN KONTA PĀRVALDĪBU
 * VERSIJA: 2026. GADA MARTA VERSIJA
 */
// Importē nepieciešamos React hook-us un komponentus
import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Home, KeyRound, LogOut, Mail, Pencil, Upload, User, X } from "lucide-react";
// Importē UI komponentus
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
// Importē autentifikācijas hook un API utilītiju
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, setToken } from "@/lib/api";
import { useLanguage } from "@/hooks/useLanguage";
import LanguageSwitch from "@/components/LanguageSwitch";
import ThemeToggle from "@/components/ThemeToggle";

// Profila datu interfeiss
interface Profile {
  id: number;
  email: string;
  username: string | null;
  profile_picture: string | null;
  created_at: string;
  updated_at: string;
}

interface UpdateProfileResponse {
  message: string;
  profile: Profile;
}

interface UpdateEmailResponse extends UpdateProfileResponse {
  token: string;
}

type EditorSection = "username" | "picture" | "email" | "password" | null;

const MAX_PROFILE_IMAGE_SIZE = 2 * 1024 * 1024;

const isValidEmail = (email: string): boolean => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

// Profila lapa - rāda lietotāja informāciju
const Profile = () => {
  // Iegūst lietotāju un izrakstīšanās funkciju
  const { user, signOut, updateUser, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { toast } = useToast();
  // Saglabā profila datus un ielādes stāvokli
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingPicture, setIsSavingPicture] = useState(false);
  const [isSavingEmail, setIsSavingEmail] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [username, setUsername] = useState("");
  const [profilePicture, setProfilePicture] = useState<string | null>(null);
  const [newEmail, setNewEmail] = useState("");
  const [emailPassword, setEmailPassword] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [activeEditor, setActiveEditor] = useState<EditorSection>(null);

  const t = {
    loading: language === "lv" ? "Ielādē..." : "Loading...",
    backToDashboard: language === "lv" ? "Atpakaļ uz Paneli" : "Back to Dashboard",
    home: language === "lv" ? "Sākumlapa" : "Home",
    profileTitle: language === "lv" ? "Tavs Profils" : "Your Profile",
    profileSubtitle: language === "lv" ? "Pārvaldi savu kontu" : "Manage your account",
    email: language === "lv" ? "E-pasts" : "Email",
    username: language === "lv" ? "Lietotājvārds" : "Username",
    profilePicture: language === "lv" ? "Profila bilde" : "Profile picture",
    profilePictureHint: language === "lv" ? "Klikšķini uz profila bildes, lai to nomainītu" : "Click the profile picture to change it",
    uploadPicture: language === "lv" ? "Augšupielādēt bildi" : "Upload picture",
    removePicture: language === "lv" ? "Noņemt bildi" : "Remove picture",
    pickImage: language === "lv" ? "Izvēlies PNG, JPG, GIF vai WEBP līdz 2 MB" : "Choose a PNG, JPG, GIF, or WEBP up to 2 MB",
    notSet: language === "lv" ? "Nav iestatīts" : "Not set",
    accountCreated: language === "lv" ? "Konts Izveidots" : "Account Created",
    notAvailable: language === "lv" ? "Nav pieejams" : "Not available",
    signOut: language === "lv" ? "Izrakstīties" : "Sign Out",
    saveProfile: language === "lv" ? "Saglabāt profilu" : "Save profile",
    savePicture: language === "lv" ? "Saglabāt bildi" : "Save picture",
    saving: language === "lv" ? "Saglabā..." : "Saving...",
    emailSettings: language === "lv" ? "Mainīt e-pastu" : "Change email",
    emailSettingsDescription: language === "lv" ? "Apstiprini ar esošo paroli, lai nomainītu e-pastu." : "Confirm with your current password to change your email.",
    newEmail: language === "lv" ? "Jaunais e-pasts" : "New email",
    currentPasswordForEmail: language === "lv" ? "Esošā parole" : "Current password",
    updateEmail: language === "lv" ? "Atjaunot e-pastu" : "Update email",
    passwordSettings: language === "lv" ? "Mainīt paroli" : "Change password",
    passwordSettingsDescription: language === "lv" ? "Ievadi esošo paroli, lai iestatītu jaunu." : "Enter your current password to set a new one.",
    currentPassword: language === "lv" ? "Esošā parole" : "Current password",
    newPassword: language === "lv" ? "Jaunā parole" : "New password",
    confirmPassword: language === "lv" ? "Atkārto jauno paroli" : "Confirm new password",
    updatePassword: language === "lv" ? "Atjaunot paroli" : "Update password",
    profileUpdated: language === "lv" ? "Profils atjaunots" : "Profile updated",
    profileUpdatedDescription: language === "lv" ? "Lietotājvārds un profila bilde ir saglabāti." : "Your username and profile picture were saved.",
    emailUpdated: language === "lv" ? "E-pasts atjaunots" : "Email updated",
    emailUpdatedDescription: language === "lv" ? "Tavs e-pasts ir veiksmīgi nomainīts." : "Your email was changed successfully.",
    passwordUpdated: language === "lv" ? "Parole atjaunota" : "Password updated",
    passwordUpdatedDescription: language === "lv" ? "Tava parole ir veiksmīgi nomainīta." : "Your password was changed successfully.",
    invalidUsernameTitle: language === "lv" ? "Nederīgs lietotājvārds" : "Invalid username",
    invalidUsernameDescription: language === "lv" ? "Lietotājvārdam jābūt no 3 līdz 50 rakstzīmēm." : "Username must be between 3 and 50 characters.",
    invalidEmailTitle: language === "lv" ? "Nederīgs e-pasts" : "Invalid email",
    invalidEmailDescription: language === "lv" ? "Ievadi derīgu e-pasta adresi." : "Enter a valid email address.",
    passwordMismatchTitle: language === "lv" ? "Paroles nesakrīt" : "Passwords do not match",
    passwordMismatchDescription: language === "lv" ? "Jaunajai parolei un apstiprinājumam jāsakrīt." : "The new password and confirmation must match.",
    invalidPasswordTitle: language === "lv" ? "Nederīga parole" : "Invalid password",
    invalidPasswordDescription: language === "lv" ? "Jaunajai parolei jābūt vismaz 6 rakstzīmes garai." : "The new password must be at least 6 characters long.",
    invalidImageTitle: language === "lv" ? "Nederīga bilde" : "Invalid image",
    invalidImageDescription: language === "lv" ? "Vari augšupielādēt tikai PNG, JPG, GIF vai WEBP failu līdz 2 MB." : "You can upload only PNG, JPG, GIF, or WEBP files up to 2 MB.",
    passwordHidden: language === "lv" ? "Drošības nolūkos parole netiek rādīta" : "Password is hidden for security",
    edit: language === "lv" ? "Rediģēt" : "Edit",
    cancel: language === "lv" ? "Atcelt" : "Cancel",
  };

  const avatarFallback = (profile?.username || user?.username || user?.email || "U").slice(0, 2).toUpperCase();

  // Ielādē profila datus, kad komponente tiek ielādēta
  useEffect(() => {
    // Gaida, līdz autentifikācija ir pārbaudīta
    if (authLoading) {
      return;
    }
    // Ja lietotājs nav pieteicies, pārvirza uz autentifikācijas lapu
    if (!user) {
      navigate("/auth");
      return;
    }

    // Iegūst profila datus no datubāzes
    const fetchProfile = async () => {
      try {
        const data = await apiRequest<{ profile: Profile }>('/profiles');
        setProfile(data.profile);
        setUsername(data.profile.username || "");
        setProfilePicture(data.profile.profile_picture);
        setNewEmail(data.profile.email);
      } catch (error: unknown) {
        console.error('Error fetching profile:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [authLoading, user, navigate]);

  // Apstrādā izrakstīšanos
  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  const resetEditorDraft = (section: Exclude<EditorSection, null>) => {
    if (section === "username") {
      setUsername(profile?.username || "");
      return;
    }

    if (section === "picture") {
      setProfilePicture(profile?.profile_picture || null);
      return;
    }

    if (section === "email") {
      setNewEmail(profile?.email || user?.email || "");
      setEmailPassword("");
      return;
    }

    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
  };

  const toggleEditor = (section: Exclude<EditorSection, null>) => {
    setActiveEditor((current) => {
      if (current === section) {
        resetEditorDraft(section);
        return null;
      }

      if (current) {
        resetEditorDraft(current);
      }

      return section;
    });
  };

  const syncProfileState = (nextProfile: Profile, nextToken?: string) => {
    setProfile(nextProfile);
    setUsername(nextProfile.username || "");
    setProfilePicture(nextProfile.profile_picture);
    setNewEmail(nextProfile.email);
    updateUser({
      id: nextProfile.id,
      email: nextProfile.email,
      username: nextProfile.username,
      profile_picture: nextProfile.profile_picture,
      created_at: nextProfile.created_at,
    });

    if (nextToken) {
      setToken(nextToken);
    }
  };

  const handleProfilePictureChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    const isSupportedType = ["image/png", "image/jpeg", "image/jpg", "image/gif", "image/webp"].includes(file.type);

    if (!isSupportedType || file.size > MAX_PROFILE_IMAGE_SIZE) {
      toast({
        title: t.invalidImageTitle,
        description: t.invalidImageDescription,
        variant: "destructive",
      });
      event.target.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setProfilePicture(typeof reader.result === "string" ? reader.result : null);
    };
    reader.readAsDataURL(file);
    event.target.value = "";
  };

  const handleProfileSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedUsername = username.trim();

    if (trimmedUsername.length < 3 || trimmedUsername.length > 50) {
      toast({
        title: t.invalidUsernameTitle,
        description: t.invalidUsernameDescription,
        variant: "destructive",
      });
      return;
    }

    setIsSavingProfile(true);

    try {
      const data = await apiRequest<UpdateProfileResponse>('/profiles', {
        method: 'PUT',
        body: JSON.stringify({
          username: trimmedUsername,
          profilePicture,
        }),
      });

      syncProfileState(data.profile);
      setActiveEditor(null);
      toast({
        title: t.profileUpdated,
        description: t.profileUpdatedDescription,
      });
    } catch (error) {
      const err = error as Error;
      toast({
        title: t.invalidUsernameTitle,
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handlePictureSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const currentUsername = (profile?.username || user?.username || "").trim();

    if (currentUsername.length < 3 || currentUsername.length > 50) {
      toast({
        title: t.invalidUsernameTitle,
        description: t.invalidUsernameDescription,
        variant: "destructive",
      });
      return;
    }

    setIsSavingPicture(true);

    try {
      const data = await apiRequest<UpdateProfileResponse>('/profiles', {
        method: 'PUT',
        body: JSON.stringify({
          username: currentUsername,
          profilePicture,
        }),
      });

      syncProfileState(data.profile);
      setActiveEditor(null);
      toast({
        title: t.profileUpdated,
        description: t.profileUpdatedDescription,
      });
    } catch (error) {
      const err = error as Error;
      toast({
        title: t.invalidImageTitle,
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setIsSavingPicture(false);
    }
  };

  const handleEmailSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedEmail = newEmail.trim().toLowerCase();

    if (!isValidEmail(trimmedEmail)) {
      toast({
        title: t.invalidEmailTitle,
        description: t.invalidEmailDescription,
        variant: "destructive",
      });
      return;
    }

    setIsSavingEmail(true);

    try {
      const data = await apiRequest<UpdateEmailResponse>('/profiles/email', {
        method: 'PUT',
        body: JSON.stringify({
          newEmail: trimmedEmail,
          currentPassword: emailPassword,
        }),
      });

      syncProfileState(data.profile, data.token);
      setEmailPassword("");
      setActiveEditor(null);
      toast({
        title: t.emailUpdated,
        description: t.emailUpdatedDescription,
      });
    } catch (error) {
      const err = error as Error;
      toast({
        title: t.invalidEmailTitle,
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setIsSavingEmail(false);
    }
  };

  const handlePasswordSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (newPassword.length < 6) {
      toast({
        title: t.invalidPasswordTitle,
        description: t.invalidPasswordDescription,
        variant: "destructive",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: t.passwordMismatchTitle,
        description: t.passwordMismatchDescription,
        variant: "destructive",
      });
      return;
    }

    setIsSavingPassword(true);

    try {
      await apiRequest<{ message: string }>('/profiles/password', {
        method: 'PUT',
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setActiveEditor(null);
      toast({
        title: t.passwordUpdated,
        description: t.passwordUpdatedDescription,
      });
    } catch (error) {
      const err = error as Error;
      toast({
        title: t.invalidPasswordTitle,
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setIsSavingPassword(false);
    }
  };

  // Ja dati vēl tiek ielādēti, parāda ielādes ziņojumu
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">{t.loading}</div>
        <div className="fixed right-4 top-4 z-20 flex gap-2">
          <ThemeToggle />
          <LanguageSwitch />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="fixed right-4 top-4 z-20 flex gap-2">
        <ThemeToggle />
        <LanguageSwitch />
      </div>
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-4 mb-8 animate-fade-in-up" style={{ animationDelay: "100ms" }}>
          <Button 
            variant="secondary" 
            size="sm" 
            onClick={() => navigate("/dashboard")}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            {t.backToDashboard}
          </Button>
          <Button 
            variant="secondary" 
            size="sm" 
            onClick={() => navigate("/")}
            className="flex items-center gap-2"
          >
            <Home className="w-4 h-4" />
            {t.home}
          </Button>
        </div>

        <Card className="bg-gradient-card border-border/50 animate-fade-in-up" style={{ animationDelay: "100ms" }}>
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <button
                type="button"
                onClick={() => toggleEditor("picture")}
                className="group relative rounded-full transition-transform hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                aria-label={t.profilePicture}
              >
                <Avatar className="h-24 w-24 border-4 border-cognitive-primary/20">
                  <AvatarImage src={profilePicture || undefined} alt={profile?.username || user?.email || "Profile"} />
                  <AvatarFallback className="bg-cognitive-primary/10 text-cognitive-primary text-2xl font-semibold">
                    {avatarFallback}
                  </AvatarFallback>
                </Avatar>
                <span className="absolute bottom-0 right-0 inline-flex h-8 w-8 items-center justify-center rounded-full border border-background bg-cognitive-primary text-primary-foreground shadow-sm">
                  {activeEditor === "picture" ? <X className="h-4 w-4" /> : <Pencil className="h-4 w-4" />}
                </span>
              </button>
            </div>
            <CardTitle className="text-2xl">{t.profileTitle}</CardTitle>
            <CardDescription>{t.profileSubtitle}</CardDescription>
            <p className="text-sm text-muted-foreground">{t.profilePictureHint}</p>
          </CardHeader>
          <CardContent className="space-y-8">
            {activeEditor === "picture" && (
              <form onSubmit={handlePictureSubmit} className="animate-in fade-in-0 slide-in-from-top-2 duration-200 space-y-4 rounded-xl border border-border/50 p-4">
                <div className="space-y-3">
                  <Label htmlFor="profile-picture">{t.profilePicture}</Label>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                    <label htmlFor="profile-picture" className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-input px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground">
                      <Upload className="h-4 w-4" />
                      {t.uploadPicture}
                    </label>
                    <Input
                      id="profile-picture"
                      type="file"
                      accept="image/png,image/jpeg,image/jpg,image/gif,image/webp"
                      className="hidden"
                      onChange={handleProfilePictureChange}
                    />
                    <Button type="button" variant="outline" onClick={() => setProfilePicture(null)}>
                      {t.removePicture}
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground">{t.pickImage}</p>
                </div>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <Button type="submit" className="flex-1" disabled={isSavingPicture}>
                    {isSavingPicture ? t.saving : t.savePicture}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => toggleEditor("picture")}>
                    {t.cancel}
                  </Button>
                </div>
              </form>
            )}

            <div className="space-y-4">
              <div className="rounded-xl border border-border/50 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">{t.email}</label>
                    <p className="text-lg">{profile?.email || user?.email}</p>
                  </div>
                  <Button type="button" variant="outline" size="sm" onClick={() => toggleEditor("email")} className="shrink-0">
                    {activeEditor === "email" ? <X className="mr-2 h-4 w-4" /> : <Pencil className="mr-2 h-4 w-4" />}
                    {activeEditor === "email" ? t.cancel : t.edit}
                  </Button>
                </div>
                {activeEditor === "email" && (
                  <form onSubmit={handleEmailSubmit} className="animate-in fade-in-0 slide-in-from-top-2 duration-200 mt-4 space-y-4 border-t border-border/50 pt-4">
                    <p className="text-sm text-muted-foreground">{t.emailSettingsDescription}</p>
                    <div className="space-y-2">
                      <Label htmlFor="new-email">{t.newEmail}</Label>
                      <Input
                        id="new-email"
                        type="email"
                        value={newEmail}
                        onChange={(event) => setNewEmail(event.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email-password">{t.currentPasswordForEmail}</Label>
                      <Input
                        id="email-password"
                        type="password"
                        value={emailPassword}
                        onChange={(event) => setEmailPassword(event.target.value)}
                        required
                      />
                    </div>
                    <div className="flex flex-col gap-3 sm:flex-row">
                      <Button type="submit" className="flex-1" disabled={isSavingEmail}>
                        {isSavingEmail ? t.saving : t.updateEmail}
                      </Button>
                      <Button type="button" variant="outline" onClick={() => toggleEditor("email")}>
                        {t.cancel}
                      </Button>
                    </div>
                  </form>
                )}
              </div>
              
              <div className="rounded-xl border border-border/50 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">{t.username}</label>
                    <p className="text-lg">{profile?.username || user?.username || t.notSet}</p>
                  </div>
                  <Button type="button" variant="outline" size="sm" onClick={() => toggleEditor("username")} className="shrink-0">
                    {activeEditor === "username" ? <X className="mr-2 h-4 w-4" /> : <Pencil className="mr-2 h-4 w-4" />}
                    {activeEditor === "username" ? t.cancel : t.edit}
                  </Button>
                </div>
                {activeEditor === "username" && (
                  <form onSubmit={handleProfileSubmit} className="animate-in fade-in-0 slide-in-from-top-2 duration-200 mt-4 space-y-4 border-t border-border/50 pt-4">
                    <div className="space-y-2">
                      <Label htmlFor="username">{t.username}</Label>
                      <Input
                        id="username"
                        value={username}
                        onChange={(event) => setUsername(event.target.value)}
                        minLength={3}
                        maxLength={50}
                        required
                      />
                    </div>
                    <div className="flex flex-col gap-3 sm:flex-row">
                      <Button type="submit" className="flex-1" disabled={isSavingProfile}>
                        {isSavingProfile ? t.saving : t.saveProfile}
                      </Button>
                      <Button type="button" variant="outline" onClick={() => toggleEditor("username")}>
                        {t.cancel}
                      </Button>
                    </div>
                  </form>
                )}
              </div>

              <div className="rounded-xl border border-border/50 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">{t.passwordSettings}</label>
                    <p className="text-lg text-muted-foreground">{t.passwordHidden}</p>
                  </div>
                  <Button type="button" variant="outline" size="sm" onClick={() => toggleEditor("password")} className="shrink-0">
                    {activeEditor === "password" ? <X className="mr-2 h-4 w-4" /> : <Pencil className="mr-2 h-4 w-4" />}
                    {activeEditor === "password" ? t.cancel : t.edit}
                  </Button>
                </div>
                {activeEditor === "password" && (
                  <form onSubmit={handlePasswordSubmit} className="animate-in fade-in-0 slide-in-from-top-2 duration-200 mt-4 space-y-4 border-t border-border/50 pt-4">
                    <p className="text-sm text-muted-foreground">{t.passwordSettingsDescription}</p>
                    <div className="space-y-2">
                      <Label htmlFor="current-password">{t.currentPassword}</Label>
                      <Input
                        id="current-password"
                        type="password"
                        value={currentPassword}
                        onChange={(event) => setCurrentPassword(event.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="new-password">{t.newPassword}</Label>
                      <Input
                        id="new-password"
                        type="password"
                        value={newPassword}
                        onChange={(event) => setNewPassword(event.target.value)}
                        minLength={6}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirm-password">{t.confirmPassword}</Label>
                      <Input
                        id="confirm-password"
                        type="password"
                        value={confirmPassword}
                        onChange={(event) => setConfirmPassword(event.target.value)}
                        minLength={6}
                        required
                      />
                    </div>
                    <div className="flex flex-col gap-3 sm:flex-row">
                      <Button type="submit" className="flex-1" disabled={isSavingPassword}>
                        {isSavingPassword ? t.saving : t.updatePassword}
                      </Button>
                      <Button type="button" variant="outline" onClick={() => toggleEditor("password")}>
                        {t.cancel}
                      </Button>
                    </div>
                  </form>
                )}
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">{t.accountCreated}</label>
                <p className="text-lg">
                  {user?.created_at ? new Date(user.created_at).toLocaleDateString() : t.notAvailable}
                </p>
              </div>
            </div>

            <div className="pt-6 border-t border-border/50">
              <Button 
                onClick={handleSignOut}
                variant="destructive"
                className="w-full"
              >
                <LogOut className="w-4 h-4 mr-2" />
                {t.signOut}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Profile;
