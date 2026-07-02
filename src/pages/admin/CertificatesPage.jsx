// src/pages/admin/CertificatesPage.jsx
import { useEffect, useState, useCallback, useRef } from ''react''
import {
  Award, Plus, FileText, Shield,
  ArrowRightLeft, BookOpen, Trophy, GraduationCap,
  Briefcase, RefreshCw, XCircle, Search, Eye,
  AlertTriangle, CheckCircle, ChevronLeft,
  ChevronRight, Sparkles, Users, UserCheck, BookMarked,
  Settings2, SlidersHorizontal, ScrollText,
  BadgeCheck, Clock, Hash
} from ''lucide-react''
import { PDFViewer } from ''@react-pdf/renderer''
import { certificateApi, studentsApi, adminTeacherControlApi, classApi } from ''@/api''
import usePageTitle from ''@/hooks/usePageTitle''
import useToast from ''@/hooks/useToast''
import Button from ''@/components/ui/Button''
import Badge from ''@/components/ui/Badge''
import Modal from ''@/components/ui/Modal''
import Select from ''@/components/ui/Select''
import Input from ''@/components/ui/Input''
import EmptyState from ''@/components/ui/EmptyState''
import TableSkeleton from ''@/components/ui/TableSkeleton''
import ConfirmDialog from ''@/components/ui/ConfirmDialog''
import { format } from ''date-fns''
import { cn } from ''@/utils/helpers''
import CertificateDownloadButton from ''@/components/pdf/certificates/CertificateDownloadButton''
import TransferCertificatePDF   from ''@/components/pdf/certificates/TransferCertificatePDF''
import BonafideCertificatePDF   from ''@/components/pdf/certificates/BonafideCertificatePDF''
import CharacterCertificatePDF  from ''@/components/pdf/certificates/CharacterCertificatePDF''
import MigrationCertificatePDF  from ''@/components/pdf/certificates/MigrationCertificatePDF''
import MarksheetCertificatePDF  from ''@/components/pdf/certificates/MarksheetCertificatePDF''
import SportsCertificatePDF     from ''@/components/pdf/certificates/SportsCertificatePDF''
import StudyCertificatePDF      from ''@/components/pdf/certificates/StudyCertificatePDF''
import ExperienceCertificatePDF from ''@/components/pdf/certificates/ExperienceCertificatePDF''
