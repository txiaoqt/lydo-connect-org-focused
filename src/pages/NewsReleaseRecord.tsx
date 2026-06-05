import { useMemo } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, CalendarDays, ExternalLink } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useLydoConnect } from "@/lib/lydo-connect-store";
import SourcePostEmbed from "@/components/SourcePostEmbed";

export default function NewsReleaseRecord() {
  const { newsReleaseId = "" } = useParams<{ newsReleaseId?: string }>();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { state } = useLydoConnect();
  const isAdminPreview = pathname.startsWith("/admin");

  const newsRelease = useMemo(
    () => state.newsReleases.find((item) => item.id === newsReleaseId) ?? null,
    [newsReleaseId, state.newsReleases],
  );

  if (!newsRelease) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="pt-16">
          <section className="container py-16">
            <Card className="border-border/70 shadow-sm">
              <CardContent className="p-6 text-center">
                <h1 className="text-2xl font-bold text-foreground">News release not found</h1>
                <p className="mt-2 text-sm text-muted-foreground">
                  The news release you are trying to preview is unavailable.
                </p>
                <div className="mt-6 flex flex-wrap justify-center gap-2">
                  <Button type="button" variant="outline" onClick={() => navigate(isAdminPreview ? "/admin/news-releases" : "/news-releases")}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to News Releases
                  </Button>
                </div>
              </CardContent>
            </Card>
          </section>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-16">
        <section className="hero-gradient py-8 sm:py-10 md:py-14">
          <div className="container">
            <div className="max-w-4xl space-y-3 sm:space-y-4">
              <p className="text-[11px] sm:text-sm font-medium text-secondary-foreground/75">Official Source Post</p>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-secondary-foreground leading-tight">
                {newsRelease.title}
              </h1>
              <p className="max-w-3xl text-sm sm:text-base leading-relaxed text-secondary-foreground/80">
                {newsRelease.description}
              </p>
              <div className="flex flex-wrap gap-2 pt-1">
                <span className="rounded-full bg-secondary-foreground/95 px-2.5 py-1 text-[11px] font-semibold text-primary sm:px-3 sm:text-xs">
                  <CalendarDays className="mr-1 inline-block h-3.5 w-3.5" />
                  {newsRelease.datePosted}
                </span>
                <span className="rounded-full border border-secondary-foreground/25 bg-secondary-foreground/20 px-2.5 py-1 text-[11px] font-semibold capitalize text-secondary-foreground sm:px-3 sm:text-xs">
                  {newsRelease.visibilityStatus}
                </span>
              </div>
            </div>
          </div>
        </section>

        <section className="container py-5 sm:py-6 md:py-10">
          <div className="grid gap-4 lg:gap-6 xl:grid-cols-[1.35fr_0.75fr] items-start">
            <div className="space-y-4">
              <Card className="border-border/70 shadow-sm">
                <CardContent className="p-4 sm:p-5 md:p-6">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-foreground">Open Source Post</p>
                      <p className="text-sm text-muted-foreground">
                        This is the Facebook preview for the selected news release.
                      </p>
                    </div>
                    <Button type="button" variant="outline" asChild>
                      <a href={newsRelease.facebookPostUrl} target="_blank" rel="noreferrer">
                        <ExternalLink className="mr-2 h-4 w-4" />
                        Open Source Post
                      </a>
                    </Button>
                  </div>

                  <div className="mt-4">
                    <SourcePostEmbed
                      sourcePostUrl={newsRelease.facebookPostUrl}
                      title={newsRelease.title}
                      instanceKey={newsRelease.id}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            <aside className="space-y-4 xl:sticky xl:top-24">
              <Card className="border-border/70 shadow-sm">
                <CardContent className="space-y-4 p-4 sm:p-5">
                  <div>
                    <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground/70">Summary</p>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Clicked from the News Releases page. This view is for previewing the source post before opening Facebook.
                    </p>
                  </div>
                  <div className="grid gap-3">
                    <div className="rounded-xl border border-border/70 bg-muted/20 p-3 text-sm">
                      <p className="font-medium text-foreground">Title</p>
                      <p className="mt-1 text-muted-foreground">{newsRelease.title}</p>
                    </div>
                    <div className="rounded-xl border border-border/70 bg-muted/20 p-3 text-sm">
                      <p className="font-medium text-foreground">Date Posted</p>
                      <p className="mt-1 text-muted-foreground">{newsRelease.datePosted}</p>
                    </div>
                    <div className="rounded-xl border border-border/70 bg-muted/20 p-3 text-sm">
                      <p className="font-medium text-foreground">Visibility</p>
                      <p className="mt-1 text-muted-foreground">{newsRelease.visibilityStatus}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="outline" onClick={() => navigate(isAdminPreview ? "/admin/news-releases" : "/news-releases")}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to News Releases
                </Button>
                <Button type="button" variant="ghost" asChild>
                  <Link to="/dashboard">Go to Dashboard</Link>
                </Button>
              </div>
            </aside>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
