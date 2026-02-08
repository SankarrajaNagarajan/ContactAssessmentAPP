import { Component, Input, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { CommonModule } from '@angular/common';
import { Contact } from '../../../core/models/contact.model';
import { ContactService } from '../../../core/services/contact.service';

@Component({
  selector: 'app-edit-contact',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './edit-contact.component.html',
  styleUrls: ['./edit-contact.component.scss']
})
export class EditContactComponent implements OnInit {
  @Input() contact: Contact | null = null;
  form: FormGroup;
  loading = false;
  submitted = false;

  constructor(
    private formBuilder: FormBuilder,
    private contactService: ContactService,
    public activeModal: NgbActiveModal
  ) {
    this.form = this.createForm();
  }

  ngOnInit(): void {
    if (this.contact) {
      this.form.patchValue(this.contact);
    }
  }

  private phoneNumberValidator = (control: AbstractControl): ValidationErrors | null => {
    if (!control.value) {
      return null;
    }
    const phoneRegex = /^[0-9\-\+\(\)\s]+$/;
    return phoneRegex.test(control.value) ? null : { invalidPhoneNumber: true };
  };

  private lettersOnlyValidator = (control: AbstractControl): ValidationErrors | null => {
    if (!control.value) {
      return null;
    }
    const lettersRegex = /^[a-zA-Z\s]+$/;
    return lettersRegex.test(control.value) ? null : { lettersOnly: true };
  };

  private createForm(): FormGroup {
    return this.formBuilder.group({
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      phoneNumber: ['', [Validators.required, this.phoneNumberValidator]],
      address: ['', Validators.required],
      city: ['', [Validators.required, this.lettersOnlyValidator]],
      state: ['', [Validators.required, this.lettersOnlyValidator]],
      country: ['', [Validators.required, this.lettersOnlyValidator]],
      postalCode: ['', Validators.required]
    });
  }

  allowOnlyNumbers(event: KeyboardEvent): void {
    const char = event.key;
    const allowedChars = /[0-9\-\+\(\)\s]/;
    if (!allowedChars.test(char)) {
      event.preventDefault();
    }
  }

  allowOnlyLetters(event: KeyboardEvent): void {
    const char = event.key;
    const allowedChars = /[a-zA-Z\s]/;
    if (!allowedChars.test(char)) {
      event.preventDefault();
    }
  }

  get f() {
    return this.form.controls;
  }

  onSubmit(): void {
    this.submitted = true;
    if (this.form.invalid) {
      return;
    }

    this.loading = true;
    const contactData: Contact = this.form.value;

    this.contactService.updateContact({ ...this.contact, ...contactData }).subscribe({
      next: () => {
        this.loading = false;
        this.activeModal.close(true);
      },
      error: (err) => {
        console.error('Error updating contact', err);
        this.loading = false;
      }
    });
  }

  onClose(): void {
    this.activeModal.dismiss(false);
  }
}
