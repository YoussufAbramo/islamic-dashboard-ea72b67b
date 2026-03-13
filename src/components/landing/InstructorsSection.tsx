import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getField } from '@/lib/landingDefaults';

interface InstructorsSectionProps {
  content: Record<string, any>;
  isAr: boolean;
}

const InstructorsSection = ({ content, isAr }: InstructorsSectionProps) => {
  const [teachers, setTeachers] = useState<any[]>([]);
  const t = (en: string, ar: string) => isAr ? ar : en;
  const maxDisplay = content?.max_display || 4;

  useEffect(() => {
    supabase
      .rpc('get_public_teachers', { max_count: maxDisplay })
      .then(({ data }) => {
        if (data) setTeachers(data.map((t: any) => ({
          id: t.id,
          specialization: t.specialization,
          bio: t.bio,
          profiles: { full_name: t.full_name, avatar_url: t.avatar_url },
        })));
      });
  }, [maxDisplay]);

  if (teachers.length === 0) return null;

  return (
    <section id="instructors" className="py-20 md:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <Badge variant="secondary" className="mb-4">{t('Instructors', 'المعلمون')}</Badge>
          <h2 className="text-3xl md:text-4xl font-bold font-amiri text-foreground mb-4">{getField(content, 'title', isAr)}</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">{getField(content, 'subtitle', isAr)}</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
          {teachers.map((teacher) => {
            const profile = teacher.profiles as any;
            return (
              <Card key={teacher.id} className="text-center border-border/50 hover:shadow-lg transition-all">
                <CardContent className="pt-6">
                  <Avatar className="h-20 w-20 mx-auto mb-4">
                    <AvatarImage src={profile?.avatar_url} />
                    <AvatarFallback className="bg-primary/10 text-primary text-xl">
                      {profile?.full_name?.charAt(0) || '?'}
                    </AvatarFallback>
                  </Avatar>
                  <h3 className="font-bold text-foreground mb-1">{profile?.full_name || 'Instructor'}</h3>
                  {teacher.specialization && (
                    <p className="text-xs text-muted-foreground mb-2">{teacher.specialization}</p>
                  )}
                  {teacher.bio && (
                    <p className="text-sm text-muted-foreground line-clamp-2">{teacher.bio}</p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default InstructorsSection;
