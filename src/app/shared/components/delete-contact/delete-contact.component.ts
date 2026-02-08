import { Component, Input, OnInit } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { CommonModule } from '@angular/common';
import { Contact } from '../../../core/models/contact.model';
import { ContactService } from '../../../core/services/contact.service';

@Component({
  selector: 'app-delete-contact',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './delete-contact.component.html',
  styleUrls: ['./delete-contact.component.scss']
})
export class DeleteContactComponent implements OnInit {
  @Input() contact: Contact | null = null;
  loading = false;

  constructor(
    private contactService: ContactService,
    public activeModal: NgbActiveModal
  ) {}

  ngOnInit(): void {}

  onConfirmDelete(): void {
    if (!this.contact?.id) {
      return;
    }

    this.loading = true;
    this.contactService.deleteContact(this.contact.id).subscribe({
      next: () => {
        this.loading = false;
        this.activeModal.close(true);
      },
      error: (err) => {
        console.error('Error deleting contact', err);
        this.loading = false;
      }
    });
  }

  onCancel(): void {
    this.activeModal.dismiss(false);
  }
}
