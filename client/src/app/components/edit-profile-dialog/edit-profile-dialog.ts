import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';

import { Users, User } from '../../services/users/users';

type EditProfileData = {
  user: User;
};

@Component({
  selector: 'app-edit-profile-dialog',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatDialogModule, MatButtonModule],
  templateUrl: './edit-profile-dialog.html',
  styleUrls: ['./edit-profile-dialog.scss'],
})
export class EditProfileDialog {
  private fb = inject(FormBuilder);
  private usersApi = inject(Users);
  private dialogRef = inject(MatDialogRef<EditProfileDialog>);
  private data = inject<EditProfileData>(MAT_DIALOG_DATA);

  saving = false;
  error = '';

  form = this.fb.nonNullable.group({
    fullName: [this.data.user.fullName || '', [Validators.required, Validators.maxLength(60)]],
    bio: [this.data.user.bio || '', [Validators.maxLength(160)]],
  });

  close(): void {
    this.dialogRef.close();
  }

  submit(): void {
    if (this.form.invalid) return;

    this.saving = true;
    this.error = '';

    this.usersApi.updateProfile(this.form.getRawValue()).subscribe({
      next: (updated) => {
        this.dialogRef.close(updated);
      },
      error: (err) => {
        console.log(err);
        this.error = err?.error?.message || 'Failed to update profile.';
        this.saving = false;
      },
    });
  }
}
