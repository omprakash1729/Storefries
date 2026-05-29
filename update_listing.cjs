const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'src', 'pages', 'Listing.tsx');
let content = fs.readFileSync(file, 'utf8');

// 1. Remove currentUser, authLoading, and Auth effect
content = content.replace(/const \[currentUser.*?useState.*?null\);\n\s*const \[authLoading.*?useState\(true\);\n/g, '');

const effectRegex = /useEffect\(\(\) => \{\n\s*supabase\.auth\.getSession.*?subscription\.unsubscribe\(\);\n\s*\}, \[\]\);/s;
content = content.replace(effectRegex, '');

// 2. Add isOwner helper
const isOwnerHelper = `
  const isOwner = () => {
    if (!listing) return false;
    try {
      const owned = JSON.parse(localStorage.getItem('storefries_owned_listings') || '[]');
      return owned.includes(listing.id);
    } catch {
      return false;
    }
  };
`;
content = content.replace(/const \[publishing, setPublishing\] = useState\(false\);/, `const [publishing, setPublishing] = useState(false);\n${isOwnerHelper}`);

// 3. Rename isAuthModalOpen -> showPublishModal
content = content.replace(/isAuthModalOpen/g, 'showPublishModal');
content = content.replace(/setIsAuthModalOpen/g, 'setShowPublishModal');

// 4. Update handleDomainRequest
content = content.replace(/if \(!listing \|\| !currentUser\) return;/g, 'if (!listing) return;');
content = content.replace(/name: currentUser\.user_metadata\?\.name \|\| currentUser\.user_metadata\?\.full_name \|\| currentUser\.email \|\| "Unknown"/g, 'name: localStorage.getItem("storefries_owner_name") || "Unknown"');
content = content.replace(/email: currentUser\.email/g, 'email: localStorage.getItem("storefries_owner_email") || ""');
content = content.replace(/company: currentUser\.user_metadata\?\.company \|\| listing\.name/g, 'company: localStorage.getItem("storefries_owner_company") || listing.name');

// 5. Update processPendingClaim (REMOVE IT)
const pendingClaimRegex = /\/\/ Handle post-login redirection.*?\n\s*if \(currentUser\) \{\n\s*processPendingClaim\(\);\n\s*\}\n\s*\}, \[currentUser\]\);/s;
content = content.replace(pendingClaimRegex, '');

// 6. Rewrite handlePublish and add handlePublishSubmit
const publishRegex = /const handlePublish = async \(\) => \{.*?finally \{\n\s*setPublishing\(false\);\n\s*\}\n\s*\};/s;

const newPublishLogic = `
  const handlePublish = () => {
    setShowPublishModal(true);
  };

  const handlePublishSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!listing) return;

    setPublishing(true);
    try {
      const mapsLink = listing.google_maps_url || \`https://www.google.com/maps/search/?api=1&query=\${encodeURIComponent(listing.formatted_address ?? listing.name)}&place_id=\${listing.place_id}\`;

      // Save lead
      const { error: leadErr } = await supabase.from("leads").insert([{
        name: modalForm.name,
        email: modalForm.email,
        phone: modalForm.phone || null,
        company: modalForm.company,
        google_maps_url: mapsLink
      }]);
      if (leadErr) console.error("Lead saving error:", leadErr);

      // Update listing
      const { error } = await supabase
        .from("listings")
        .update({ owner_email: modalForm.email })
        .eq("id", listing.id);
        
      if (error) throw error;
      
      // Update local storage
      const owned = JSON.parse(localStorage.getItem('storefries_owned_listings') || '[]');
      if (!owned.includes(listing.id)) {
        owned.push(listing.id);
        localStorage.setItem('storefries_owned_listings', JSON.stringify(owned));
      }
      localStorage.setItem('storefries_owner_email', modalForm.email);
      localStorage.setItem('storefries_owner_name', modalForm.name);
      localStorage.setItem('storefries_owner_company', modalForm.company);

      // Update local state
      setListing(prev => prev ? { ...prev, owner_email: modalForm.email } : null);
      toast.success("Your page is listed in Storefries!");
      setShowPublishModal(false);
      
      setTimeout(() => setShowDomainPrompt(true), 500);

    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to publish listing.");
    } finally {
      setPublishing(false);
    }
  };
`;
content = content.replace(publishRegex, newPublishLogic);

// 7. Update UI Checks
content = content.replace(/\{listing\.user_id && currentUser && \(listing\.user_id === currentUser\.id \|\| currentUser\.email === "prakash04082002@gmail\.com"\) && \(/g, '{isOwner() && (');
content = content.replace(/\{listing\.user_id === currentUser\?\.id && \(/g, '{isOwner() && (');

// Publishing bar logic
// Remove currentUser checks
content = content.replace(/!\(\(!listing\.user_id && !currentUser\) \|\| \(listing\.user_id && currentUser && \(listing\.user_id === currentUser\.id \|\| currentUser\.email === "prakash04082002@gmail\.com"\)\)\)/g, '!( (!listing.user_id && !listing.owner_email) || isOwner() )');

content = content.replace(/!\(!listing\.user_id && !currentUser\) &&/g, '((listing.user_id || listing.owner_email) && !isOwner()) &&');

content = content.replace(/\{\(!listing\.user_id && !currentUser\) \? \(/g, '{(!listing.user_id && !listing.owner_email) ? (');

content = content.replace(/\) : currentUser \? \(/g, ') : isOwner() ? (');

content = content.replace(/\{!listing\.user_id && !currentUser && \(/g, '{(!listing.user_id && !listing.owner_email) && (');


// 8. Rewrite the Modal JSX
const modalRegex = /<Dialog open=\{showPublishModal\}.*?<\/Dialog>/s;
const newModalLogic = `
      <Dialog open={showPublishModal} onOpenChange={setShowPublishModal}>
        <DialogContent className="sm:max-w-[425px] p-0 overflow-hidden bg-background border-border/50">
          <div className="p-8">
            <DialogHeader className="mb-6 space-y-2 text-center">
              <DialogTitle className="text-2xl font-bold tracking-tight">Publish Your Page</DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground">
                Enter your details to claim and publish this premium listing page.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handlePublishSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name *</Label>
                <Input id="name" required placeholder="John Doe" value={modalForm.name} onChange={e => setModalForm({...modalForm, name: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input id="email" type="email" required placeholder="john@example.com" value={modalForm.email} onChange={e => setModalForm({...modalForm, email: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="company">Company Name *</Label>
                <Input id="company" required placeholder="Storefries Inc." value={modalForm.company} onChange={e => setModalForm({...modalForm, company: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input id="phone" type="tel" placeholder="+1 (555) 000-0000" value={modalForm.phone} onChange={e => setModalForm({...modalForm, phone: e.target.value})} />
              </div>
              <Button type="submit" disabled={publishing} className="w-full mt-6 h-11">
                {publishing ? "Publishing..." : "Publish Page"}
              </Button>
            </form>
          </div>
        </DialogContent>
      </Dialog>
`;
content = content.replace(modalRegex, newModalLogic);

// Write back
fs.writeFileSync(file, content);
console.log("Listing.tsx updated!");
