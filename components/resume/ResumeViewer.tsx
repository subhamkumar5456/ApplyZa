'use client'

import { ParsedResume } from '@/types/resume'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  User,
  Briefcase,
  GraduationCap,
  Code,
  Award,
  FolderOpen,
  Globe,
  Mail,
  Phone,
  MapPin,
  Linkedin,
  ExternalLink,
} from 'lucide-react'

interface ResumeViewerProps {
  data: ParsedResume
}

export function ResumeViewer({ data }: ResumeViewerProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-2xl">{data.contact.name || 'Unnamed'}</CardTitle>
              <div className="flex flex-wrap gap-3 mt-2 text-sm text-muted-foreground">
                {data.contact.email && (
                  <span className="flex items-center gap-1">
                    <Mail className="h-3 w-3" />
                    {data.contact.email}
                  </span>
                )}
                {data.contact.phone && (
                  <span className="flex items-center gap-1">
                    <Phone className="h-3 w-3" />
                    {data.contact.phone}
                  </span>
                )}
                {data.contact.location && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {data.contact.location}
                  </span>
                )}
                {data.contact.linkedin && (
                  <a href={data.contact.linkedin} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-brand-400 hover:underline">
                    <Linkedin className="h-3 w-3" />
                    LinkedIn
                  </a>
                )}
                {data.contact.website && (
                  <a href={data.contact.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-brand-400 hover:underline">
                    <ExternalLink className="h-3 w-3" />
                    Website
                  </a>
                )}
              </div>
            </div>
          </div>
        </CardHeader>
        {data.summary && (
          <CardContent>
            <p className="text-sm text-muted-foreground leading-relaxed">{data.summary}</p>
          </CardContent>
        )}
      </Card>

      <Tabs defaultValue="experience" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="experience" className="gap-1">
            <Briefcase className="h-3 w-3" />
            <span className="hidden sm:inline">Experience</span>
          </TabsTrigger>
          <TabsTrigger value="education" className="gap-1">
            <GraduationCap className="h-3 w-3" />
            <span className="hidden sm:inline">Education</span>
          </TabsTrigger>
          <TabsTrigger value="skills" className="gap-1">
            <Code className="h-3 w-3" />
            <span className="hidden sm:inline">Skills</span>
          </TabsTrigger>
          <TabsTrigger value="projects" className="gap-1">
            <FolderOpen className="h-3 w-3" />
            <span className="hidden sm:inline">Projects</span>
          </TabsTrigger>
          <TabsTrigger value="certs" className="gap-1">
            <Award className="h-3 w-3" />
            <span className="hidden sm:inline">Certs</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="experience" className="space-y-4 mt-4">
          {data.experience.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No experience data found</p>
          ) : (
            data.experience.map((exp, i) => (
              <Card key={i}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="font-semibold">{exp.title}</h4>
                      <p className="text-sm text-muted-foreground">{exp.company} {exp.location && `• ${exp.location}`}</p>
                    </div>
                    <Badge variant="outline" className="whitespace-nowrap">
                      {exp.start_date} — {exp.current ? 'Present' : exp.end_date}
                    </Badge>
                  </div>
                  {exp.description.length > 0 && (
                    <ul className="list-disc list-inside space-y-1 mt-3">
                      {exp.description.map((desc, j) => (
                        <li key={j} className="text-sm text-muted-foreground">{desc}</li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="education" className="space-y-4 mt-4">
          {data.education.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No education data found</p>
          ) : (
            data.education.map((edu, i) => (
              <Card key={i}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-semibold">{edu.degree} in {edu.field}</h4>
                      <p className="text-sm text-muted-foreground">{edu.institution}</p>
                      {edu.gpa && <p className="text-xs text-muted-foreground mt-1">GPA: {edu.gpa}</p>}
                    </div>
                    <Badge variant="outline">
                      {edu.start_date} — {edu.end_date}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="skills" className="mt-4">
          <Card>
            <CardContent className="pt-6">
              {data.skills.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No skills data found</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {data.skills.map((skill, i) => (
                    <Badge key={i} variant="secondary">{skill}</Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="projects" className="space-y-4 mt-4">
          {data.projects.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No projects data found</p>
          ) : (
            data.projects.map((proj, i) => (
              <Card key={i}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-semibold">{proj.name}</h4>
                    {proj.url && (
                      <a href={proj.url} target="_blank" rel="noopener noreferrer" className="text-brand-400 hover:underline text-sm">
                        View →
                      </a>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">{proj.description}</p>
                  <div className="flex flex-wrap gap-1">
                    {proj.technologies.map((tech, j) => (
                      <Badge key={j} variant="outline" className="text-xs">{tech}</Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="certs" className="space-y-4 mt-4">
          {data.certifications.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No certifications found</p>
          ) : (
            data.certifications.map((cert, i) => (
              <Card key={i}>
                <CardContent className="pt-6">
                  <h4 className="font-semibold">{cert.name}</h4>
                  <p className="text-sm text-muted-foreground">{cert.issuer} • {cert.date}</p>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
